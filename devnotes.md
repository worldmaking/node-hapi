https://www.sidefx.com/docs/hengine/_h_a_p_i__full_source_samples__compiling_samples.html

cl /Zi /EHsc /DEBUG /I "<path to Houdini install location>\toolkit\include" source/materials.cpp "<path to Houdini install location>\custom\houdini\dsolib\libHAPIL.lib"





if you need to copy all dlls from a folder to the build/release:

'msvs_settings' : {
						'VCCLCompilerTool' : {
							'AdditionalOptions' : ['/Ox','/Zi', '/Oy','/GL','/GF','/Gm-','/EHsc','/MT','/GS','/Gy','/GR-','/Gd']
						},
						'VCLinkerTool' : {
							'AdditionalOptions' : ['/OPT:REF','/OPT:ICF','/LTCG']
						},
					},


'copies': [
						{
							'destination': './build/Release/',
							'files': [
								"<!@(node -p \"require('fs').readdirSync('C:/Program Files/Side Effects Software/Houdini 18.0.499/bin').filter(f=>f.endsWith('.dll')).map(f=>`'C:/Program Files/Side Effects Software/Houdini 18.0.499/bin/${f}'`).join(' ')\")"
							]
						}
					]