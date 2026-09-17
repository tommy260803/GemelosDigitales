import os
replacements = {
    'Logâ‚ â‚€': 'Log₁₀',
    '~10â ´': '~10⁴',
    '~10Â²': '~10²',
    'Q1â€“Q5': 'Q1–Q5',
    'â€¢': '•',
    'â‰¥': '≥',
    'Hâ‚€': 'H₀',
    'Hâ‚ ': 'H₁',
    'RÂ²': 'R²',
    'âš¡': '⚡',
    '2â€“3': '2–3',
    'Ã¢â€°Â¥': '≥',
    'Ã¢â‚¬â€œ': '–',
    'Ã¢â‚¬Â¢': '•',
    'Ã—': '×'
}
for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
            except: continue
            new_content = content
            for bad, good in replacements.items():
                new_content = new_content.replace(bad, good)
            if new_content != content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f'Fixed {path}')
print('Done!')
