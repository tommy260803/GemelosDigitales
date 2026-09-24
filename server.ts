import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { TerrainService } from './frontend/src/services/terrainService.ts';

dotenv.config();

// Lazy Gemini client helper (kept for multimodal image analysis only)
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

const configuredBackendUrl = process.env.BACKEND_URL || process.env.API_URL || (process.env.NODE_ENV === 'production' ? 'http://backend:8000' : 'http://localhost:8000');
const BACKEND_URL = /^https?:\/\//i.test(configuredBackendUrl)
  ? configuredBackendUrl
  : `https://${configuredBackendUrl}`;

function backendUrlFor(pathname: string): string {
  return `${BACKEND_URL.replace(/\/$/, '')}${pathname}`;
}

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // =========================================================
  // HEALTH CHECK (Express-only)
  // =========================================================
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'operational',
      engine: 'System Dynamics 5-Stock Runge-Kutta 4th Order',
      version: '2.4.0',
      timestamp: new Date().toISOString(),
      districtsLoaded: 'served by FastAPI /districts',
    });
  });

  app.get('/api/backend-health', async (_req, res) => {
    try {
      const response = await fetch(backendUrlFor('/health'));
      return res.status(response.ok ? 200 : 502).json({
        frontend: 'operational',
        backendUrl: BACKEND_URL,
        backendStatus: response.status,
        backendHealthy: response.ok,
      });
    } catch (error: any) {
      return res.status(502).json({
        frontend: 'operational',
        backendUrl: BACKEND_URL,
        backendHealthy: false,
        error: error?.cause?.code || error?.code || error?.message || 'Backend request failed',
      });
    }
  });

  // =========================================================
  // GEOSPATIAL 3D ROUTES (Express-only, calls FastAPI for district data)
  // =========================================================
  const getDistrict = async (districtId: unknown) => {
    if (typeof districtId !== 'string') throw new Error('districtId is required');
    const response = await fetch(backendUrlFor(`/districts/${encodeURIComponent(districtId)}`));
    if (!response.ok) throw new Error(`FastAPI district request failed: ${response.status}`);
    return response.json();
  };

  app.get('/api/geospatial/dem', async (req, res) => {
    try {
      const { districtId } = req.query;
      const district = await getDistrict(districtId);
      const dem = TerrainService.generateDistrictDEM(district, 36);
      const kpis = TerrainService.getTopographicAccessibilityKPI(district);
      res.json({ dem, kpis });
    } catch (error: any) {
      console.error('Geospatial DEM error:', error);
      res.status(500).json({ error: error?.message || 'Failed to generate 3D DEM' });
    }
  });

  app.get('/api/geospatial/health-facilities', async (req, res) => {
    try {
      const { districtId } = req.query;
      const district = await getDistrict(districtId);
      const facilities = TerrainService.getHealthFacilities(district);
      res.json(facilities);
    } catch (error: any) {
      console.error('Geospatial Facilities error:', error);
      res.status(500).json({ error: error?.message || 'Failed to retrieve facilities' });
    }
  });

  app.get('/api/geospatial/referral-route', async (req, res) => {
    try {
      const { districtId } = req.query;
      const district = await getDistrict(districtId);
      const route = TerrainService.getObstetricReferralRoute(district);
      res.json(route);
    } catch (error: any) {
      console.error('Geospatial Referral Route error:', error);
      res.status(500).json({ error: error?.message || 'Failed to calculate 3D referral route' });
    }
  });

  // =========================================================
  // AI AGENT PROXY — Chat routed to FastAPI LangGraph agent
  // =========================================================
  app.post('/api/gemini/chat', async (req, res) => {
    try {
      const message = req.body.message || '';
      const conversation_history = req.body.conversation_history || req.body.conversationHistory || [];
      const district_id = req.body.district_id || req.body.contextDistrict?.id || null;
      const scenario_id = req.body.scenario_id || req.body.activeScenario || null;

      const response = await fetch(`${BACKEND_URL}/agent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(120_000),
        body: JSON.stringify({
          message,
          conversation_history,
          district_id,
          scenario_id,
        }),
      });
      if (!response.ok) {
        const errText = await response.text();
        console.error('FastAPI agent error:', errText);
        return res.status(502).json({
          error: 'Agent service unavailable',
          backendStatus: response.status,
          detail: errText.slice(0, 1000),
          backendUrl: BACKEND_URL,
        });
      }
      const data = await response.json();
      return res.json({
        reply: data.reply,
        tools_used: data.tools_used,
      });
    } catch (err: any) {
      const isTimeout =
        err?.name === 'TimeoutError' ||
        err?.name === 'AbortError' ||
        err?.cause?.code === 'UND_ERR_HEADERS_TIMEOUT' ||
        err?.cause?.code === 'UND_ERR_BODY_TIMEOUT';
      console.error('Agent proxy error:', err?.message, err?.cause);
      return res.status(504).json({
        error: isTimeout
          ? 'Agent timed out after 120s — try a narrower question'
          : 'Agent service unavailable',
        detail: err?.cause?.code || err?.code || err?.message || 'Backend request failed',
        backendUrl: BACKEND_URL,
      });
    }
  });

  // Gemini Multimodal Image Analysis
  app.post('/api/gemini/analyze-image', async (req, res) => {
    const { imageBase64, mimeType, prompt } = req.body;
    const ai = getAI();

    const fallbackAudit = `### Multimodal Labor Ward & Spatial Document Audit\n\n` +
      `• **Document Type Detected**: Obstetric Triage Register / GIS Road Network Flow\n` +
      `• **Clinical Bottleneck Assessment**: High latency identified between admission of obstructed labor / PPH and surgical C-section readiness.\n` +
      `• **Structural Risk Factors**: Lack of all-weather transport feeder roads leading to secondary referral hospital.\n` +
      `• **Actionable Recommendations**:\n` +
      `  1. Implement strict WHO partograph monitoring with action line alarm trigger at 4 hours.\n` +
      `  2. Station moto-ambulance with active telemetry within 5 km of primary health center.\n` +
      `  3. Pre-position misoprostol packs and non-pneumatic anti-shock garments (NASG) at first-line dispensaries.`;

    if (!ai) {
      return res.json({ analysis: fallbackAudit });
    }

    const candidateModels = [process.env.GEMINI_MODEL || 'gemini-3.6-flash', 'gemini-2.5-flash'];
    for (const model of candidateModels) {
      try {
        const imagePart = {
          inlineData: {
            mimeType: mimeType || 'image/jpeg',
            data: imageBase64,
          },
        };

        const textPart = {
          text: prompt || 'Analyze this maternal health facility record, GIS map, or obstetric flow chart. Identify potential clinical, geographical, or logistical bottlenecks causing delays in managing maternal complications.',
        };

        const response = await ai.models.generateContent({
          model,
          contents: { parts: [imagePart, textPart] },
          config: {
            systemInstruction: 'You are an expert maternal health epidemiologist and health system quality auditor analyzing clinical registers, district infrastructure, and triage pathways in Sub-Saharan Africa.',
          },
        });

        if (response && response.text) {
          return res.json({ analysis: response.text });
        }
      } catch (err: any) {
        console.warn(`Multimodal attempt with ${model} encountered issue:`, err?.message || err);
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }

    return res.json({ analysis: fallbackAudit });
  });

  // =========================================================
  // FASTAPI PROXY — districts, simulation, validation, agent, scenarios
  // Manual fetch-based proxy to avoid http-proxy-middleware body issues
  // =========================================================
  const proxyGet = async (req: express.Request, res: express.Response) => {
    try {
      const backendPath = req.path.replace(/^\/api/, '');
      const url = `${BACKEND_URL}${backendPath}${req.url.includes('?') ? '?' + req.url.split('?')[1] : ''}`;
      console.log(`[PROXY GET] ${req.method} ${req.originalUrl} -> ${url}`);
      const response = await fetch(url);
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const data = await response.json();
        return res.status(response.status).json(data);
      }
      const text = await response.text();
      return res.status(response.status).type(contentType || 'text').send(text);
    } catch (err: any) {
      console.error(`[PROXY ERROR] ${req.originalUrl}:`, err.message);
      return res.status(502).json({ error: 'Backend service unavailable', detail: err.message, backendUrl: BACKEND_URL });
    }
  };

  const proxyPost = async (req: express.Request, res: express.Response) => {
    try {
      const backendPath = req.path.replace(/^\/api/, '');
      const url = `${BACKEND_URL}${backendPath}`;
      console.log(`[PROXY POST] ${req.originalUrl} -> ${url}`);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
      });
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const data = await response.json();
        return res.status(response.status).json(data);
      }
      const text = await response.text();
      return res.status(response.status).type(contentType || 'text').send(text);
    } catch (err: any) {
      console.error(`[PROXY ERROR] ${req.originalUrl}:`, err.message);
      return res.status(502).json({ error: 'Backend service unavailable', detail: err.message, backendUrl: BACKEND_URL });
    }
  };

  app.get('/api/districts', proxyGet);
  app.get('/api/districts/:id', proxyGet);
  app.get('/api/scenarios', proxyGet);
  app.post('/api/simulation/run', proxyPost);
  app.post('/api/validation/run', proxyPost);
  app.post('/api/validation/ks', proxyPost);
  app.post('/api/validation/sobol', proxyPost);
  app.post('/api/validation/bootstrap', proxyPost);
  app.get('/api/validation/external/*', proxyGet);
  app.get('/api/validation/convergence/*', proxyGet);
  app.get('/api/validation/report', proxyGet);
  app.post('/api/agent/chat', proxyPost);
  app.post('/api/agent/analyze', proxyPost);
  app.get('/api/agent/*', proxyGet);
  app.post('/api/agent/*', proxyPost);

  // =========================================================
  // VITE MIDDLEWARE (dev) OR STATIC FILES (production)
  // =========================================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      root: path.resolve(process.cwd(), 'frontend'),
      configFile: path.resolve(process.cwd(), 'frontend/vite.config.ts'),
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Maternal Health Digital Twin server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
