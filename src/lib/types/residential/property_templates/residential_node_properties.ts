import { GraphNodeProperties } from "../../../core";

export interface ResidentialGraphNodeProperties extends GraphNodeProperties {
    cat: string;
    pcat: string;
    gid?: number;
}

export const ResidentialNodeCategories = {
    'Entrance' : 'entrance',
    'Entrance shoe cabinet' : 'entrance_cabinet',
    'Kitchen' : 'kitchen',
    'Kitchen Counter' : 'kitchen_counter',
    'Dining Room' : 'dining',
    'Study' : 'study',
    'Household Shelter' : 'hs',
    'Living Room' : 'living',
    'Bedroom' : 'br',
    'Master Bedroom' : 'm_br',
    'Bedroom Wardrobe' : 'wardrobe',
    'Walk in Wardrobe' : 'walk_in_wardrobe',
    'Bathroom (adjacent to toilet + shower)' : 'bath',
    'Master Bathroom' : 'm_bath',
    'Shower' : 'shower',
    'W/C (toilet + sink only)' : 'wc',
    'AC Ledge' : 'ac',
    'RC Ledge' : 'rc',
    'Adjacent Unit' : 'other_unit',
    'Adjacent Lobby Lift' : 'lobby_lift',
    'Private Lift Lobby' : 'private_lift_lobby',
    'Private Lift' : 'private_lift',
    'Rainwater Downpipe' : 'rwdp',
    'Lobby' : 'lobby',
    'Balcony' : 'balcony',
    'Junior Master Bedroom' : 'j_br',
    'Junior Master Bathroom' : 'j_bath',
    'Other Unit' : 'other_unit',
    'External' : 'external',
    'Washer & Dryer' : 'washer_dryer',
    'Fridge' : 'fridge',
    'Dry Kitchen' : 'dry_kitchen',
    'Store' : 'store',
    'DB' : 'db',
    'Utility' : 'utility',
    'Corridor' : 'Corridor',
    'Shaft' : 'shaft',
    'Yard' : 'yard',
    'Breakfast Counter' : 'breakfast_counter',
    'Wet Kitchen' : 'wet_kitchen',
    'Family Room' : 'family',
    'Studio' : 'studio',
    'Kitchenette' : 'kitchenette',
    'Lobby Stair' : 'lobby_stair',
    'Powder Room' : 'powder_room',
    'Refuse Chute' : 'refuse_chute',
}

export const ExternalUnitCategories = [
    'Adjacent Unit',
    'other_unit',
    'Other Unit',
    'Lobby',
    'lobby',
    'Private Lift Lobby',
    'private_lift_lobby',
    'private_lift_lobby',
    'Adjacent Lobby Lift',
    'lobby_lift',
    'External',
    'external',
    'Lobby Stair',
    'lobby_stair',
]

export const WalledCategories = [
    'Shaft',
    'shaft',
    'Rainwater Downpipe',
    'rwdp',
]

export const nonGFACategories = [
    'Rainwater Downpipe',
    'rwdp',
    'Shaft',
    'shaft',
]

export const wetKitchenComponents = [
    'Wet Kitchen',
    'wet kitchen',
    'Shaft',
    'shaft',
]

export const dryKitchenComponents = [
    'Dry Kitchen',
    'dry kitchen',
    'Shaft',
    'shaft',
]

export const bathComponents = [
    'Shower',
    'shower',
    'W/C (toilet + sink only)',
    'wc',
    'Bathroom (adjacent to toilet + shower)',
    'bath',
    'Shaft',
    'shaft',
]

export const kitchenComponents = [
    'Kitchen',
    'kitchen',
    'Kitchenette',
    'kitchenette',
    'Fridge',
    'fridge',
    'Shaft',
    'shaft',
]

export const bedroomComponents = [
    'Bedroom',
    'br',
    'Bedroom Wardrobe',
    'wardrobe',
    'Walk in Wardrobe',
    'walk_in_wardrobe',
]

export const masterBedroomComponents = [
    'Master Bedroom',
    'm_br',
    'Bedroom Wardrobe',
    'wardrobe',
    'Walk in Wardrobe',
    'walk_in_wardrobe',

]

export const masterBathroomComponents = [
    'Master Bathroom',
    'm_bath',
    'Shaft',
    'shaft',
    'W/C (toilet + sink only)',
    'wc',
]

export const juniorMasterBedroomComponents = [
    'Junior Master Bedroom',
    'j_br',
    'Bedroom Wardrobe',
    'wardrobe',
    'Walk in Wardrobe',
    'walk_in_wardrobe',
]

export const juniorMasterBathroomComponents = [
    'Junior Master Bathroom',
    'j_bath',
    'Shaft',
    'shaft',
    'W/C (toilet + sink only)',
    'wc',
]

export const lobbyComponents = [
    'Adjacent Lobby Lift',
    'lobby_lift',
    'Lobby',
    'lobby'
]

export const masterComponentParentList = {
    'Wet Kitchen' : wetKitchenComponents,
    'Dry Kitchen' : dryKitchenComponents,
    'Kitchen' : kitchenComponents,
    'Bathroom (adjacent to toilet + shower)' : bathComponents,
    'Bedroom' : bedroomComponents,
    'Master Bedroom' : masterBedroomComponents,
    'Master Bathroom' : masterBathroomComponents,
    'Junior Master Bedroom' : juniorMasterBedroomComponents,
    'Junior Master Bathroom' : juniorMasterBathroomComponents,
    'Lobby' : lobbyComponents,
}