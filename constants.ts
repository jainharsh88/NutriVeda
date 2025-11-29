import { CuisineType, DietType, Recipe } from './types';

export const MOCK_RECIPES: Recipe[] = [
  {
    id: '1',
    name: 'Palak Paneer',
    image: 'https://images.unsplash.com/photo-1589647363585-f4a7d3877b10?q=80&w=1000&auto=format&fit=crop',
    cuisine: CuisineType.North,
    prepTime: '40 mins',
    calories: 320,
    ingredients: [
      { name: 'Spinach', quantity: '500g' },
      { name: 'Paneer', quantity: '200g' },
      { name: 'Garlic', quantity: '4 cloves' },
      { name: 'Ginger', quantity: '1 inch' },
      { name: 'Cream', quantity: '2 tbsp' }
    ],
    steps: [
      'Blanch spinach and blend into a paste.',
      'Sauté garlic and ginger in ghee.',
      'Add spices and spinach puree.',
      'Simmer and add paneer cubes.',
      'Finish with fresh cream.'
    ],
    healthTags: ['High Iron', 'Calcium Rich', 'Keto Friendly'],
    isFavorite: true,
    description: 'A creamy and nutritious spinach curry with cottage cheese.'
  },
  {
    id: '2',
    name: 'Masala Dosa',
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?q=80&w=1000&auto=format&fit=crop',
    cuisine: CuisineType.South,
    prepTime: '20 mins (plus fermentation)',
    calories: 180,
    ingredients: [
      { name: 'Rice Batter', quantity: '2 cups' },
      { name: 'Potatoes', quantity: '3 boiled' },
      { name: 'Onions', quantity: '1 large' },
      { name: 'Mustard Seeds', quantity: '1 tsp' }
    ],
    steps: [
      'Prepare potato masala with spices and onions.',
      'Spread batter on a hot griddle.',
      'Add ghee and crisp up the dosa.',
      'Stuff with masala and roll.'
    ],
    healthTags: ['Probiotic', 'Gluten Free', 'Energy Boosting'],
    isFavorite: false,
    description: 'Crispy fermented crepe stuffed with spiced potatoes.'
  },
  {
    id: '3',
    name: 'Macher Jhol',
    image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?q=80&w=1000&auto=format&fit=crop',
    cuisine: CuisineType.East,
    prepTime: '45 mins',
    calories: 250,
    ingredients: [
      { name: 'Fish Fillet (Rohu)', quantity: '4 pcs' },
      { name: 'Potatoes', quantity: '2' },
      { name: 'Tomato', quantity: '1' },
      { name: 'Mustard Oil', quantity: '2 tbsp' }
    ],
    steps: [
      'Marinate fish with turmeric and salt.',
      'Fry fish lightly and set aside.',
      'Prepare curry base with spices and potatoes.',
      'Simmer fish in the curry until cooked.'
    ],
    healthTags: ['High Protein', 'Omega-3', 'Heart Healthy'],
    isFavorite: false,
    description: 'A traditional Bengali fish curry rich in flavors.'
  },
  {
    id: '4',
    name: 'Dhokla',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=1000&auto=format&fit=crop',
    cuisine: CuisineType.West,
    prepTime: '25 mins',
    calories: 150,
    ingredients: [
      { name: 'Gram Flour', quantity: '1 cup' },
      { name: 'Yogurt', quantity: '1/2 cup' },
      { name: 'Green Chili', quantity: '2' },
      { name: 'Eno Fruit Salt', quantity: '1 tsp' }
    ],
    steps: [
      'Mix flour, yogurt, and water into a batter.',
      'Steam the batter for 15-20 minutes.',
      'Prepare tempering with mustard seeds and curry leaves.',
      'Pour tempering over steamed dhokla.'
    ],
    healthTags: ['Low Calorie', 'Protein Rich', 'Diabetic Friendly'],
    isFavorite: false,
    description: 'Steamed savory cake made from fermented batter.'
  }
];

export const INITIAL_USER: import('./types').UserPreferences = {
  name: 'Guest User',
  allergies: ['Peanuts'],
  dietaryPreference: DietType.Veg,
  deficiencies: ['Iron', 'Vitamin D']
};