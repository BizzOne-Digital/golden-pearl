export type MenuItem = {
  id: string;
  _id?: string;
  name: string;
  description: string;
  price: number;
  image: string;
};

export type MenuCategory = {
  id: string;
  _id?: string;
  name: string;
  image?: string;
  items: MenuItem[];
};

export type MenuResponse = {
  restaurant: string;
  address?: string;
  categories: MenuCategory[];
};

export type CartLine = {
  key: string;
  productId?: string;
  externalId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
};
