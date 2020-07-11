https://www.sidefx.com/docs/hengine/_h_a_p_i__full_source_samples__compiling_samples.html

cl /Zi /EHsc /DEBUG /I "<path to Houdini install location>\toolkit\include" source/materials.cpp "<path to Houdini install location>\custom\houdini\dsolib\libHAPIL.lib"

1. set process.env (process environment variable) to add the houdini install to the system %PATH% -- that way it can find whatever dlls etc. it needs. I did that in the "test.js" right before loading the binary module.
2. Use libHAPIL.lib not libHAPI.lib -- the latter tries to host the engine directly (probably hitting license issues), the former loads an IPC shim that lets us talk to the engine as a separate process, but is otherwise equivalent. Maybe we might need to revisit this at some point, we'll see. 


'msvs_settings' : {
						'VCCLCompilerTool' : {
							'AdditionalOptions' : ['/Ox','/Zi', '/Oy','/GL','/GF','/Gm-','/EHsc','/MT','/GS','/Gy','/GR-','/Gd']
						},
						'VCLinkerTool' : {
							'AdditionalOptions' : ['/OPT:REF','/OPT:ICF','/LTCG']
						},
					},


if you need to copy all dlls from a folder to the build/release:
'copies': [
						{
							'destination': './build/Release/',
							'files': [
								"<!@(node -p \"require('fs').readdirSync('C:/Program Files/Side Effects Software/Houdini 18.0.499/bin').filter(f=>f.endsWith('.dll')).map(f=>`'C:/Program Files/Side Effects Software/Houdini 18.0.499/bin/${f}'`).join(' ')\")"
							]
						}
					]