# Texture credits

All textures are **CC0 1.0 Universal** (public domain dedication) from [Poly Haven](https://polyhaven.com). Poly Haven states "Our assets are all licensed as CC0" ([licence page](https://polyhaven.com/license)). Attribution is not required; it is given here anyway. Licence shown on each asset page and re-checked on 2026-10-12.

| Asset                           | Author        | Asset page                            | Used for                             |
| ------------------------------- | ------------- | ------------------------------------- | ------------------------------------ |
| Asphalt Snow (`asphalt_snow`)   | eye-candy.xyz | https://polyhaven.com/a/asphalt_snow  | Road surface (packed snow and slush) |
| Snow 02 (`snow_02`)             | Rob Tuytel    | https://polyhaven.com/a/snow_02       | Ground snow and snowbanks            |
| Factory Brick (`factory_brick`) | Rob Tuytel    | https://polyhaven.com/a/factory_brick | Exchange District brick buildings    |

## Processing

Source: the 1K PNG maps (`_diff`, `_nor_gl`, `_rough`). No other edits. Converted with `scripts/prepare-textures.mjs` (sharp): resized with Lanczos, WebP encoded (colour q80, normal q90, roughness q78 greyscale).

| Tier              | Files                                                                                                                                          |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `high` / `medium` | `asphalt_snow`: colour, normal, roughness at 1024². `snow_02`: colour, roughness at 1024². `factory_brick`: colour, normal, roughness at 512². |
| `low`             | 512² colour only: `asphalt_snow_color_512`, `snow_02_color_512`, `factory_brick_color_512`.                                                    |

Displacement and AO maps are not used. A `snow_02` normal map was evaluated and is not shipped unless it visibly helps in the scene.

Real-world size of one tile (from the asset pages): `asphalt_snow` 2 m, `snow_02` 2 m, `factory_brick` 1.5 m.
