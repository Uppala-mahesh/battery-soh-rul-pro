from pathlib import Path
from scipy.io import loadmat
import json

path = Path('/home/ubuntu/battery-soh-rul-pro/ml/data/nasa_extracted/1. BatteryAgingARC-FY08Q4/B0005.mat')
data = loadmat(path, squeeze_me=True, struct_as_record=False)
print('keys:', [key for key in data if not key.startswith('__')])
battery = data.get('B0005')
print('battery_type:', type(battery))
print('battery_fields:', getattr(battery, '_fieldnames', None))
if battery is not None:
    for field in getattr(battery, '_fieldnames', []) or []:
        value = getattr(battery, field)
        print(field, type(value), getattr(value, 'shape', None))
        if field == 'cycle':
            cycles = value if hasattr(value, '__len__') else [value]
            print('cycle_count:', len(cycles))
            for idx, cycle in enumerate(cycles[:3]):
                print('cycle', idx, 'fields', getattr(cycle, '_fieldnames', None))
                for cfield in getattr(cycle, '_fieldnames', []) or []:
                    cvalue = getattr(cycle, cfield)
                    print(' ', cfield, type(cvalue), getattr(cvalue, 'shape', None), repr(cvalue)[:180])
                    if cfield == 'data':
                        print('  data_fields:', getattr(cvalue, '_fieldnames', None))
                        for dfield in getattr(cvalue, '_fieldnames', []) or []:
                            dvalue = getattr(cvalue, dfield)
                            print('   ', dfield, type(dvalue), getattr(dvalue, 'shape', None), repr(dvalue)[:180])
