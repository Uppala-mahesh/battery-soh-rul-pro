from pathlib import Path
import json
import pandas as pd

source = Path('/home/ubuntu/upload/file2.csv')
out = Path('/home/ubuntu/battery-soh-rul-pro/dataset_profile.json')
df = pd.read_csv(source)
profile = {
    'source': str(source),
    'rows': int(len(df)),
    'columns': list(df.columns),
    'dtypes': {k: str(v) for k, v in df.dtypes.items()},
    'missing': {k: int(v) for k, v in df.isna().sum().items()},
    'unique_counts': {k: int(v) for k, v in df.nunique(dropna=True).items()},
    'head': df.head(5).astype(object).where(pd.notna(df.head(5)), None).to_dict(orient='records'),
    'numeric_summary': df.select_dtypes(include='number').describe().round(6).to_dict(),
}
out.write_text(json.dumps(profile, indent=2, default=str))
print(json.dumps(profile, indent=2, default=str))
