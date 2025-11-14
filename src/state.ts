import { atom, selector, selectorFamily } from "recoil";
import { getLocation, getPhoneNumber, getUserInfo } from "zmp-sdk";
import logo from "static/logo.png";
import { Category } from "types/category";
import { Product, Variant } from "types/product";
import { Cart } from "types/cart";
import { Notification } from "types/notification";
import { calculateDistance } from "utils/location";
import { Store } from "types/delivery";
import { calcFinalPrice } from "utils/product";
import { wait } from "utils/async";

// Import service functions
import { fetchProducts } from "../services/productsService";
import { fetchCategories } from "../services/categoriesService";
import { fetchVariants } from "../services/variantsService";

// --- User ---
export const userState = selector({
  key: "user",
  get: async () => {
    const { userInfo } = await getUserInfo({ autoRequestPermission: true });
    return userInfo;
  },
});

// --- Categories ---
export const categoriesState = selector<Category[]>({
  key: "categories",
  get: async () => {
    try {
      const categories = await fetchCategories();
      return categories as Category[];
    } catch (error) {
      console.error('Error loading categories:', error);
      return [];
    }
  },
});

// --- Products ---
// --- Products ---
export const productsState = selector<Product[]>({
  key: "products",
  get: async () => {
    try {
      const products = await fetchProducts();
      const variants = await fetchVariants();

      return products.map((product: any) => ({
        ...product,
        variants: variants.filter((variant: any) =>
          product.variantId?.includes?.(variant.id)
        ),
      })) as Product[];
    } catch (error) {
      console.error('Error loading products:', error);
      return [];
    }
  },
});

// --- Recommended Products ---
export const recommendProductsState = selector<Product[]>({
  key: "recommendProducts",
  get: ({ get }) => {
    const products = get(productsState);
    console.log("Products in recommendProductsState:", products);
    return products.filter((p) => p.sale);
  },
});

// --- Selected Category ---
export const selectedCategoryIdState = atom({
  key: "selectedCategoryId",
  default: "coffee",
});

export const productsByCategoryState = selectorFamily<Product[], string>({
  key: "productsByCategory",
  get:
    (categoryId) =>
    ({ get }) => {
      const allProducts = get(productsState);
      return allProducts.filter((product) =>
        product.categoryId.includes(categoryId)
      );
    },
});

// --- Cart ---
export const cartState = atom<Cart>({
  key: "cart",
  default: [],
});

export const totalQuantityState = selector({
  key: "totalQuantity",
  get: ({ get }) => {
    const cart = get(cartState);
    return cart.reduce((total, item) => total + item.quantity, 0);
  },
});

export const totalPriceState = selector({
  key: "totalPrice",
  get: ({ get }) => {
    const cart = get(cartState);
    return cart.reduce(
      (total, item) =>
        total + item.quantity * calcFinalPrice(item.product, item.options),
      0
    );
  },
});

// --- Notifications ---
export const notificationsState = atom<Notification[]>({
  key: "notifications",
  default: [
    {
      id: 1,
      image: logo,
      title: "Chào bạn mới",
      content: "Cảm ơn đã sử dụng ZaUI Coffee, bạn có thể dùng ứng dụng này để tiết kiệm thời gian xây dựng",
    },
    {
      id: 2,
      image: logo,
      title: "Giảm 50% lần đầu mua hàng",
      content: "Nhập WELCOME để được giảm 50% giá trị đơn hàng đầu tiên order",
    },
  ],
});

// --- Keyword Search ---
export const keywordState = atom({
  key: "keyword",
  default: "",
});

export const resultState = selector<Product[]>({
  key: "result",
  get: async ({ get }) => {
    const keyword = get(keywordState);
    if (!keyword.trim()) return [];

    const products = get(productsState);
    await wait(500);

    return products.filter((product) =>
      product.name.trim().toLowerCase().includes(keyword.trim().toLowerCase())
    );
  },
});

// --- Stores ---
export const storesState = atom<Store[]>({
  key: "stores",
  default: [
    { id: 1, name: "VNG Campus Store", address: "Khu chế xuất Tân Thuận, Z06, Số 13, Tân Thuận Đông, Quận 7, TP.HCM, Việt Nam", lat: 10.741639, long: 106.714632 },
    { id: 2, name: "The Independence Palace", address: "135 Nam Kỳ Khởi Nghĩa, Bến Thành, Quận 1, TP.HCM, Việt Nam", lat: 10.779159, long: 106.695271 },
    { id: 3, name: "Saigon Notre-Dame Cathedral Basilica", address: "1 Công xã Paris, Bến Nghé, Quận 1, TP.HCM, Việt Nam", lat: 10.779738, long: 106.699092 },
    { id: 4, name: "Bình Quới Tourist Village", address: "1147 Bình Quới, P.28, Bình Thạnh, TP.HCM, Việt Nam", lat: 10.831098, long: 106.733128 },
    { id: 5, name: "Củ Chi Tunnels", address: "Phú Hiệp, Củ Chi, TP.HCM, Việt Nam", lat: 11.051655, long: 106.494249 },
  ],
});

export const nearbyStoresState = selector({
  key: "nearbyStores",
  get: ({ get }) => {
    const location = get(locationState);
    const stores = get(storesState);

    if (location) {
      return stores
        .map((store) => ({
          ...store,
          distance: calculateDistance(location.latitude, location.longitude, store.lat, store.long),
        }))
        .sort((a, b) => a.distance - b.distance);
    }
    return [];
  },
});

export const selectedStoreIndexState = atom({ key: "selectedStoreIndex", default: 0 });
export const selectedStoreState = selector({
  key: "selectedStore",
  get: ({ get }) => {
    const index = get(selectedStoreIndexState);
    const stores = get(nearbyStoresState);

    // === BẢO VỆ CHỐNG CRASH ===
    // 1. Kiểm tra 'stores' có phải là một mảng (Array) không
    // 2. Kiểm tra 'index' có phải là một số hợp lệ trong mảng đó không
    if (
      !Array.isArray(stores) || 
      index === null || 
      index < 0 || 
      index >= stores.length
    ) {
      // Nếu không an toàn, trả về null (hoặc undefined)
      // Điều này sẽ KHÔNG làm crash ứng dụng
      return null; 
    }
    // === KẾT THÚC BẢO VỆ ===

    // Nếu an toàn, trả về cửa hàng đã chọn
    return stores[index];
  },
});
export const selectedDeliveryTimeState = atom({ key: "selectedDeliveryTime", default: +new Date() });
export const requestLocationTriesState = atom({ key: "requestLocationTries", default: 0 });
export const requestPhoneTriesState = atom({ key: "requestPhoneTries", default: 0 });

// --- Location ---
export const locationState = selector<{ latitude: string; longitude: string } | false>({
  key: "location",
  get: async ({ get }) => {
    const requested = get(requestLocationTriesState);
    if (!requested) return false;

    const { latitude, longitude, token } = await getLocation({ fail: console.warn });
    if (latitude && longitude) return { latitude, longitude };

    console.log("Sử dụng token hoặc giả lập vị trí mặc định: VNG Campus");
    return { latitude: "10.7287", longitude: "106.7317" };
  },
});

// --- Phone ---
export const phoneState = selector<string | boolean>({
  key: "phone",
  get: async ({ get }) => {
    const requested = get(requestPhoneTriesState);
    if (!requested) return false;

    try {
      const { number, token } = await getPhoneNumber({ fail: console.warn });
      if (number) return number;

      console.warn("Giả lập số điện thoại mặc định: 0337076898");
      return "0337076898";
    } catch (error) {
      console.error(error);
      return false;
    }
  },
});

export const orderNoteState = atom({
  key: "orderNote",
  default: "",
});

// ===== THÊM MỚI: Địa chỉ người nhận =====
export const deliveryAddressState = atom({
  key: "deliveryAddress",
  default: "",
})
