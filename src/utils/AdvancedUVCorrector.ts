import * as THREE from 'three'

interface Tri {
  vi: [number, number, number]
  p: [THREE.Vector3, THREE.Vector3, THREE.Vector3]
  uv: [THREE.Vector2, THREE.Vector2, THREE.Vector2]
}

export class AdvancedUVCorrector {
  private geo: THREE.BufferGeometry
  private origUVs: Float32Array
  private tris: Tri[] = []
  private v2t: Map<number, number[]> = new Map()
  private strength: number = 1.0

  constructor(mesh: THREE.Mesh) {
    this.geo = mesh.geometry as THREE.BufferGeometry
    this.origUVs = new Float32Array(this.geo.attributes.uv.array as Float32Array)
    this.init()
  }

  private init(): void {
    const pos = this.geo.attributes.position.array as Float32Array
    const uv = this.geo.attributes.uv.array as Float32Array
    const idx = this.geo.index?.array

    const add = (v: number, t: number) => {
      if (!this.v2t.has(v)) this.v2t.set(v, [])
      this.v2t.get(v)!.push(t)
    }

    const push = (i0: number, i1: number, i2: number) => {
      this.tris.push({
        vi: [i0, i1, i2],
        p: [
          new THREE.Vector3(pos[i0*3], pos[i0*3+1], pos[i0*3+2]),
          new THREE.Vector3(pos[i1*3], pos[i1*3+1], pos[i1*3+2]),
          new THREE.Vector3(pos[i2*3], pos[i2*3+1], pos[i2*3+2])
        ],
        uv: [
          new THREE.Vector2(uv[i0*2], uv[i0*2+1]),
          new THREE.Vector2(uv[i1*2], uv[i1*2+1]),
          new THREE.Vector2(uv[i2*2], uv[i2*2+1])
        ]
      })
      add(i0, this.tris.length - 1)
      add(i1, this.tris.length - 1)
      add(i2, this.tris.length - 1)
    }

    if (idx) {
      for (let i = 0; i < idx.length; i += 3) push(idx[i], idx[i+1], idx[i+2])
    } else {
      const c = this.geo.attributes.position.count
      for (let i = 0; i < c; i += 3) if (i + 2 < c) push(i, i+1, i+2)
    }
  }

  private bary(p: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3): THREE.Vector3 {
    const v0 = new THREE.Vector3().subVectors(b, a)
    const v1 = new THREE.Vector3().subVectors(c, a)
    const v2 = new THREE.Vector3().subVectors(p, a)
    const d00 = v0.dot(v0)
    const d01 = v0.dot(v1)
    const d11 = v1.dot(v1)
    const d20 = v2.dot(v0)
    const d21 = v2.dot(v1)
    const d = d00 * d11 - d01 * d01
    if (Math.abs(d) < 1e-10) return new THREE.Vector3(1/3, 1/3, 1/3)
    const v = (d11 * d20 - d01 * d21) / d
    const w = (d00 * d21 - d01 * d20) / d
    return new THREE.Vector3(1 - v - w, v, w)
  }

  private lerpUV(b: THREE.Vector3, uv0: THREE.Vector2, uv1: THREE.Vector2, uv2: THREE.Vector2): THREE.Vector2 {
    return new THREE.Vector2(
      b.x * uv0.x + b.y * uv1.x + b.z * uv2.x,
      b.x * uv0.y + b.y * uv1.y + b.z * uv2.y
    )
  }

  setStrength(s: number): void {
    this.strength = Math.max(0, Math.min(1, s))
  }

  correct(modified?: number[]): void {
    const pos = this.geo.attributes.position.array as Float32Array
    const uvAttr = this.geo.attributes.uv
    const uvs = uvAttr.array as Float32Array

    const triSet = modified
      ? new Set(modified.flatMap(v => this.v2t.get(v) || []))
      : new Set(this.tris.map((_, i) => i))

    const buf = new Map<number, THREE.Vector2>()

    for (const ti of triSet) {
      const t = this.tris[ti]
      const [i0, i1, i2] = t.vi
      const [p0, p1, p2] = t.p
      const [uv0, uv1, uv2] = t.uv

      const p0n = new THREE.Vector3(pos[i0*3], pos[i0*3+1], pos[i0*3+2])
      const p1n = new THREE.Vector3(pos[i1*3], pos[i1*3+1], pos[i1*3+2])
      const p2n = new THREE.Vector3(pos[i2*3], pos[i2*3+1], pos[i2*3+2])

      const b0 = this.bary(p0n, p0, p1, p2)
      const b1 = this.bary(p1n, p0, p1, p2)
      const b2 = this.bary(p2n, p0, p1, p2)

      const uvNew0 = this.lerpUV(b0, uv0, uv1, uv2)
      const uvNew1 = this.lerpUV(b1, uv0, uv1, uv2)
      const uvNew2 = this.lerpUV(b2, uv0, uv1, uv2)

      const verts = [i0, i1, i2]
      const uvNew = [uvNew0, uvNew1, uvNew2]

      for (let i = 0; i < 3; i++) {
        const vi = verts[i]
        const origU = this.origUVs[vi * 2]
        const origV = this.origUVs[vi * 2 + 1]
        const newU = uvNew[i].x
        const newV = uvNew[i].y
        const finalU = origU + (newU - origU) * this.strength
        const finalV = origV + (newV - origV) * this.strength

        if (!buf.has(vi)) {
          buf.set(vi, new THREE.Vector2(finalU, finalV))
        } else {
          const ex = buf.get(vi)!
          ex.x = (ex.x + finalU) / 2
          ex.y = (ex.y + finalV) / 2
        }
      }
    }

    for (const [vi, v] of buf) {
      uvs[vi * 2] = v.x
      uvs[vi * 2 + 1] = v.y
    }

    uvAttr.needsUpdate = true
  }

  reset(): void {
    const uvAttr = this.geo.attributes.uv
    const uvs = uvAttr.array as Float32Array
    uvs.set(this.origUVs)
    uvAttr.needsUpdate = true
  }
}
