import os
import glob

for filepath in glob.glob('app/shops/[slug]/templates/*.tsx'):
    with open(filepath, 'r') as f:
        content = f.read()
    
    if 'return (' in content:
        # Just find the first 'return (' after 'ctx;' and remove it
        idx1 = content.find('} = ctx;')
        if idx1 != -1:
            idx2 = content.find('return (', idx1)
            
            # Check if there is another 'return ' after idx2
            if content.find('return', idx2 + 8) != -1:
                # Yes, there's another return. So the wrapper is invalid.
                content = content[:idx2] + content[idx2+8:]
                
                # remove the closing '    );\n}'
                idx3 = content.rfind('    );')
                if idx3 != -1:
                    content = content[:idx3] + '}' + content[idx3+6:]
                
                with open(filepath, 'w') as f:
                    f.write(content)
                    print(f'Fixed {filepath}')
