export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'TEACHER' | 'PARENT';
  phone?: string;
  avatar?: string;
}

export interface Student {
  id: string;
  name: string;
  gender: string;
  birthday: string;
  enrollDate: string;
  avatar?: string;
  address?: string;
  classId: string;
  class?: Class;
}

export interface Class {
  id: string;
  name: string;
  grade: string;
  capacity: number;
  teacherId: string;
  teacher?: User;
}

export interface GrowthRecord {
  id: string;
  studentId: string;
  type: 'LEARNING' | 'LIFE' | 'HEALTH' | 'BEHAVIOR' | 'ARTWORK';
  category?: string;
  title: string;
  content: string;
  images?: string[];
  tags?: string[];
  height?: number;
  weight?: number;
  recordedBy: string;
  recordedAt: string;
}

export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  protein: number;
  fat: number;
  carbs: number;
  calories: number;
}

export interface Dish {
  id: string;
  name: string;
  category: string;
  price: number;
  ingredients?: DishIngredient[];
}

export interface DishIngredient {
  id: string;
  dishId: string;
  ingredientId: string;
  quantity: number;
  ingredient?: Ingredient;
}

export interface Menu {
  id: string;
  date: string;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  dishes?: MenuDish[];
}

export interface MenuDish {
  id: string;
  menuId: string;
  dishId: string;
  servings: number;
  dish?: Dish;
}

export interface FormTemplate {
  id: string;
  title: string;
  description?: string;
  fields: any;
  isActive: boolean;
}

export interface FormSubmission {
  id: string;
  templateId: string;
  submittedBy: string;
  data: any;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}
