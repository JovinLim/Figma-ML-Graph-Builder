import { GraphNodeProperties } from "../../../core";

export interface ResidentialGraphNodeProperties extends GraphNodeProperties {
    cat: string;
    pcat: string;
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
}

export const ExternalUnitCategories = [
    'shaft',
    'other_unit',
    'lobby',
    'private_lift_lobby',
    'lobby_lift',
    'ac',
    'rc',
    'external',
]
