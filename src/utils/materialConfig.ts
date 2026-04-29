/**
 * Material Presets Configuration
 * PBR textures for different material types
 */

export interface MaterialPreset {
  name: string
  map: string
  normalMap?: string
  roughnessMap?: string
  metalnessMap?: string
}

export const MATERIALS: Record<string, MaterialPreset> = {
  'dark-wood-stain': {
    name: 'Dark Wood Stain',
    map: '/materials/dark-wood-stain/dark-wood-stain_albedo.png',
    normalMap: '/materials/dark-wood-stain/dark-wood-stain_normal-ogl.png',
    roughnessMap: '/materials/dark-wood-stain/dark-wood-stain_metallic-dark-wood-stain_roughness.png',
  },
  'Aluminum-Scuffed': {
    name: 'Aluminum Scuffed',
    map: '/materials/Aluminum-Scuffed/Aluminum-Scuffed_basecolor.png',
    normalMap: '/materials/Aluminum-Scuffed/Aluminum-Scuffed_normal.png',
    roughnessMap: '/materials/Aluminum-Scuffed/Aluminum-Scuffed_metallic-Aluminum-Scuffed_roughness.png',
  },
  'fiber-textured-wall1': {
    name: 'Fiber Textured Wall',
    map: '/materials/fiber-textured-wall1/fiber-textured-wall1_albedo.png',
    normalMap: '/materials/fiber-textured-wall1/fiber-textured-wall1_normal-ogl.png',
    roughnessMap: '/materials/fiber-textured-wall1/fiber-textured-wall1_metallic-fiber-textured-wall1_roughness.png',
  },
}

export function getMaterialKeys(): string[] {
  return Object.keys(MATERIALS)
}

export function getMaterialName(key: string): string {
  return MATERIALS[key]?.name || key
}