import os

bad_to_good = {
    'Ã¡': 'á',
    'Ã©': 'é',
    'Ã³': 'ó',
    'Ã±': 'ñ',
    'Ã\xad': 'í',  # Ãí (but \xad is soft hyphen, so it often shows as just Ã)
    'Ã\x8d': 'Í',
    'Ã\x81': 'Á',
    'Ã\x93': 'Ó',
    'Ã\x9a': 'Ú',
    'Ãº': 'ú',
    'Â¿': '¿',
    'Â¡': '¡',
    'Â€”': '—',
    'â€”': '—',
    'â€“': '–',
    'Ã\x89': 'É',
    'Ã\x91': 'Ñ',
    'Â': '', # sometimes stray Â
    'Dinǭmica': 'Dinámica',
    '?': '—', # Sometimes rendering replaces the long dash with this
    '?"': '—',
    '': 'á', # Let's be careful with this one, maybe skip it.
}

# Safer specific replacements based on what we saw:
replacements = {
    'DINÃ¡MICA': 'DINÁMICA',
    'DinÃ¡mica': 'Dinámica',
    'Dinmica': 'Dinámica',
    'Dinǭmica': 'Dinámica',
    'Ã¡': 'á',
    'Ã©': 'é',
    'Ã³': 'ó',
    'Ã±': 'ñ',
    'Ãº': 'ú',
    'Â€”': '—',
    'â€”': '—',
    '?"': '—',
    'frica': 'África',
    'Ã\xad': 'í',
    'Ã\x8d': 'Í',
    'Ã\x81': 'Á',
    'Ã\x93': 'Ó',
    'Ã\x9a': 'Ú',
    'Â¿': '¿',
    'Â¡': '¡',
    'Ã\x89': 'É',
    'Ã\x91': 'Ñ',
    'GeogrÃ¡fico': 'Geográfico',
    'SistÃ©micos': 'Sistémicos',
    'SISTÃ‰MICOS': 'SISTÉMICOS',
    'HipÃ³tesis': 'Hipótesis',
    'HIPÃ“TESIS': 'HIPÓTESIS',
    'InstantÃ¡neos': 'Instantáneos',
    'INSTANTÃ\x81NEOS': 'INSTANTÁNEOS',
}

def fix_mojibake(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                filepath = os.path.join(root, file)
                
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                except UnicodeDecodeError:
                    continue
                
                new_content = content
                for bad, good in replacements.items():
                    new_content = new_content.replace(bad, good)
                
                # Manual fixes for things that might have been mangled differently
                new_content = new_content.replace('frica Subsahariana', 'África Subsahariana')
                new_content = new_content.replace('frica', 'África') # Careful, maybe safe if it only says África
                new_content = new_content.replace('África', 'África')
                new_content = new_content.replace('', '') # Remove stray unknown chars if they are hanging around, but better not, it could break emojis.
                
                # Let's target the exact string from the screenshot:
                new_content = new_content.replace(') ?" {language', ') — {language')
                new_content = new_content.replace(') ?" {language', ') — {language')
                new_content = new_content.replace(') â€” {language', ') — {language')
                new_content = new_content.replace(') Â€” {language', ') — {language')
                
                if content != new_content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Fixed encoding in: {filepath}")

if __name__ == '__main__':
    fix_mojibake('src')
    print("Done!")
