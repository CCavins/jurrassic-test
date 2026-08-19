import { publicUrl } from '../utils/paths'

export interface DinosaurConfig {
  id: string
  name: string
  scientificName?: string
  descriptor: string
  modelUrl: string
  thumbnailUrl: string
  targetLengthMeters: number
  targetHeightMeters?: number
  defaultAnimation: string
  availableAnimations: string[]
  ambientAnimations: string[]
  modelYawOffset?: number
  groundOffset?: number
}

export const dinosaurs: DinosaurConfig[] = [
  {
    id: 'trex',
    name: 'Tyrannosaurus Rex',
    scientificName: 'Tyrannosaurus rex',
    descriptor: 'The ultimate apex predator.',
    modelUrl: publicUrl('models/trex.glb'),
    thumbnailUrl: publicUrl('images/dinosaurs/trex.jpg'),
    targetLengthMeters: 12,
    targetHeightMeters: 4,
    defaultAnimation: 'Armature|TRex_Idle',
    availableAnimations: [
      'Armature|TRex_Idle',
      'Armature|TRex_Attack',
      'Armature|TRex_Walk',
      'Armature|TRex_Run',
      'Armature|TRex_Jump',
    ],
    ambientAnimations: ['Armature|TRex_Attack'],
    groundOffset: 0,
  },
  {
    id: 'velociraptor',
    name: 'Velociraptor',
    scientificName: 'Velociraptor mongoliensis',
    descriptor: 'A swift and precise hunter.',
    modelUrl: publicUrl('models/velociraptor.glb'),
    thumbnailUrl: publicUrl('images/dinosaurs/velociraptor.jpg'),
    targetLengthMeters: 2,
    targetHeightMeters: 0.5,
    defaultAnimation: 'Armature|Velociraptor_Idle',
    availableAnimations: [
      'Armature|Velociraptor_Idle',
      'Armature|Velociraptor_Attack',
      'Armature|Velociraptor_Walk',
      'Armature|Velociraptor_Run',
    ],
    ambientAnimations: ['Armature|Velociraptor_Attack'],
    groundOffset: 0,
  },
  {
    id: 'triceratops',
    name: 'Triceratops',
    scientificName: 'Triceratops horridus',
    descriptor: 'A horned guardian of the plains.',
    modelUrl: publicUrl('models/triceratops.glb'),
    thumbnailUrl: publicUrl('images/dinosaurs/triceratops.jpg'),
    targetLengthMeters: 8,
    targetHeightMeters: 3,
    defaultAnimation: 'Armature|Triceratops_Idle',
    availableAnimations: [
      'Armature|Triceratops_Idle',
      'Armature|Triceratops_Attack',
      'Armature|Triceratops_Walk',
      'Armature|Triceratops_Run',
    ],
    ambientAnimations: ['Armature|Triceratops_Attack'],
    groundOffset: 0,
  },
  {
    id: 'stegosaurus',
    name: 'Stegosaurus',
    scientificName: 'Stegosaurus stenops',
    descriptor: 'Plated, patient, and immense.',
    modelUrl: publicUrl('models/stegosaurus.glb'),
    thumbnailUrl: publicUrl('images/dinosaurs/stegosaurus.jpg'),
    targetLengthMeters: 9,
    targetHeightMeters: 4,
    defaultAnimation: 'Armature|Stegosaurus_Idle',
    availableAnimations: [
      'Armature|Stegosaurus_Idle',
      'Armature|Stegosaurus_Attack',
      'Armature|Stegosaurus_Walk',
      'Armature|Stegosaurus_Run',
    ],
    ambientAnimations: ['Armature|Stegosaurus_Attack'],
    groundOffset: 0,
  },
  {
    id: 'parasaurolophus',
    name: 'Parasaurolophus',
    scientificName: 'Parasaurolophus walkeri',
    descriptor: 'A crested traveler of river valleys.',
    modelUrl: publicUrl('models/parasaurolophus.glb'),
    thumbnailUrl: publicUrl('images/dinosaurs/parasaurolophus.jpg'),
    targetLengthMeters: 10,
    targetHeightMeters: 4,
    defaultAnimation: 'Armature|Parasaurolophus_Idle',
    availableAnimations: [
      'Armature|Parasaurolophus_Idle',
      'Armature|Parasaurolophus_Attack',
      'Armature|Parasaurolophus_Walk',
      'Armature|Parasaurolophus_Run',
    ],
    ambientAnimations: ['Armature|Parasaurolophus_Attack'],
    groundOffset: 0,
  },
  {
    id: 'apatosaurus',
    name: 'Apatosaurus',
    scientificName: 'Apatosaurus ajax',
    descriptor: 'A long-necked giant of the floodplain.',
    modelUrl: publicUrl('models/apatosaurus.glb'),
    thumbnailUrl: publicUrl('images/dinosaurs/apatosaurus.jpg'),
    targetLengthMeters: 22,
    targetHeightMeters: 4.6,
    defaultAnimation: 'Armature|Apatosaurus_Idle',
    availableAnimations: [
      'Armature|Apatosaurus_Idle',
      'Armature|Apatosaurus_Attack',
      'Armature|Apatosaurus_Walk',
      'Armature|Apatosaurus_Run',
    ],
    ambientAnimations: ['Armature|Apatosaurus_Attack'],
    groundOffset: 0,
  },
]

export function getDinosaur(id: string): DinosaurConfig | undefined {
  return dinosaurs.find((dinosaur) => dinosaur.id === id)
}
