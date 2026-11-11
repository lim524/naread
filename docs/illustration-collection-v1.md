# Symbolic illustration collection v1

100 assets: 20 animals × five elemental moods. Ten approved pilot images are retained unchanged; the remaining 90 are individually generated with built-in image_gen.

These are the service's symbolic illustrations, not a traditional classification or a medical/personality assessment.

## Files

- `public/illustrations/collection-v1/<animal>-<element>.png`: generated original.
- `public/illustrations/collection-v1/<animal>-<element>.webp`: 1024 × 1024 web asset.
- `public/illustrations/collection-v1/catalog.json`: names, animal/element keys and public paths.
- `public/illustrations/collection-v1/preview-all.png`: all 100 images; one animal per row.
- `public/illustrations/collection-v1/preview-1.png` through `preview-4.png`: 25 images each.
- `docs/illustrations-v1-manifest.json`: complete generation prompts and Korean display names.

Element order in every preview: wood (목), fire (화), earth (토), metal (금), water (수).

Rebuild WebP files, catalog, and preview sheets from the originals:

```powershell
node scripts/build-illustration-collection.cjs
```

All 100 originals must exist before the script succeeds. The script preserves the pilot PNG files by copying them into the collection. Existing page illustrations and result-selection logic are not changed by this asset collection.
