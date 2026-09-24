---
name: epidemiological-sd-modeling
description: >-
  Use this skill when auditing, designing, or calibrating System Dynamics models,
  ordinary differential equations (ODEs), or epidemiological indicators for maternal health.
---

# Epidemiological System Dynamics Modeling Skill

This skill guides the agent through verifying, adjusting, and analyzing the 5-stock maternal health system dynamics engine.

## The 5-Stock Differential Equation Model

The core ODE model tracks the movement of pregnant women through five distinct stocks:

$$\begin{aligned}
\frac{dW}{dt} &= \text{Conceptions} - \text{ANC\_Initiation} - \text{Direct\_Home\_Delivery} \\
\frac{dA}{dt} &= \text{ANC\_Initiation} - \text{Facility\_Admission} - \text{Default\_Home} \\
\frac{dD}{dt} &= \text{Facility\_Admission} + \text{Emergency\_Referral} - \text{Discharge} \\
\frac{dP}{dt} &= \text{Discharge} - \text{Postpartum\_Exit} \\
\frac{dC}{dt} &= \text{Complications\_Onset} - \text{Emergency\_Referral} - \text{Fatalities}
\end{aligned}$$

## Verification Checklist

1. **Mass Conservation**: Ensure total flows entering and exiting stocks balance with overall live births and deaths over the simulation horizon.
2. **Convergence Testing**:
   - Run multi-step Cauchy verification with timesteps $\Delta t = 0.1$, $\Delta t = 0.05$, and $\Delta t = 0.025$.
   - Confirm relative error $\epsilon_{rel} = \frac{|x_{\Delta t} - x_{\Delta t / 2}|}{|x_{\Delta t / 2}|} < 0.01\%$.
3. **Scenario Consistency**:
   - Scenario A: Focuses on Delay 2 (Moto-ambulances, transit speed).
   - Scenario B: Focuses on financial barriers (User fee abolition).
   - Scenario C: Focuses on Delay 1 (TBA early alarm protocol).
   - Scenario D: Comprehensive synergy ($A + B + C + \text{clinical training}$).
4. **Cost-Effectiveness (WHO-CHOICE)**:
   - Calculate ICER as $\frac{\Delta \text{Cost}}{\Delta \text{DALYs}}$.
   - Interventions with $\text{ICER} < 1\times \text{GDP per capita}$ are classified as "Highly Cost-Effective".
