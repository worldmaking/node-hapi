

if you need to copy all dlls from a folder to the build/release:



'copies': [
						{
							'destination': './build/Release/',
							'files': [
								"<!@(node -p \"require('fs').readdirSync('C:/Program Files/Side Effects Software/Houdini 18.0.499/bin').filter(f=>f.endsWith('.dll')).map(f=>`'C:/Program Files/Side Effects Software/Houdini 18.0.499/bin/${f}'`).join(' ')\")"
							]
						}
					]