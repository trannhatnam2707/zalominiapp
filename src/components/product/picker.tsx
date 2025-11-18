// src/components/product/picker.tsx - CẬP NHẬT
import { FinalPrice } from "components/display/final-price";
import { Sheet } from "components/fullscreen-sheet";
import React, { FC, ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useSetRecoilState } from "recoil";
import { cartState } from "state";
import { SelectedOptions } from "types/cart";
import { Product } from "types/product";
import { isIdentical } from "utils/product";
import { Box, Button, Text } from "zmp-ui";
import { MultipleOptionPicker } from "./multiple-option-picker";
import { QuantityPicker } from "./quantity-picker";
import { SingleOptionPicker } from "./single-option-picker";
import { useNavigate } from "react-router"; // ✅ THÊM

export interface ProductPickerProps {
  product?: Product;
  selected?: {
    options: SelectedOptions;
    quantity: number;
  };
  children: (methods: { open: () => void; close: () => void }) => ReactNode;
}

function getDefaultOptions(product?: Product) {
  if (product && product.variants) {
    return product.variants.reduce(
      (options, variant) =>
        Object.assign(options, {
          [variant.id]: variant.default,
        }),
      {},
    );
  }
  return {};
}

export const ProductPicker: FC<ProductPickerProps> = ({
  children,
  product,
  selected,
}) => {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<SelectedOptions>(
    selected ? selected.options : getDefaultOptions(product),
  );
  const [quantity, setQuantity] = useState(1);
  const setCart = useSetRecoilState(cartState);
  const navigate = useNavigate(); // ✅ THÊM

  useEffect(() => {
    if (selected) {
      setOptions(selected.options);
      setQuantity(selected.quantity);
    }
  }, [selected]);

  // ✅ HÀM KIỂM TRA OPTION "MAY THEO SỐ ĐO"
  const checkMeasurementOption = (opts: SelectedOptions): boolean => {
    console.log("🔍 Checking measurement option...");
    console.log("Product:", product?.name);
    console.log("Product variants:", product?.variants);
    console.log("Selected options:", opts);

    if (!product?.variants) {
      console.log("❌ No variants found");
      return false;
    }

    for (const variant of product.variants) {
      console.log("Checking variant:", variant.id, variant.label);
      
      for (const option of variant.options) {
        console.log("  - Option:", option.id, option.label);
        
        // ✅ KIỂM TRA ID hoặc label có chứa từ khóa liên quan đến "đo may"
        const isMeasurementOption = 
          option.id === "measurement" ||
          option.id === "custom-measurement" ||
          option.id === "may-do" || // ✅ THÊM ID CỦA BẠN
          option.label?.toLowerCase().includes("may theo số đo") ||
          option.label?.toLowerCase().includes("đo may") ||
          option.label?.toLowerCase().includes("may đo") ||
          option.label?.toLowerCase().includes("custom measurement");

        console.log("    Is measurement option?", isMeasurementOption);

        if (isMeasurementOption) {
          // Kiểm tra xem option này có được chọn không
          const variantValue = opts[variant.id];
          console.log("    Variant value:", variantValue);
          
          // ✅ KIỂM TRA STRING (single option)
          if (typeof variantValue === "string" && variantValue === option.id) {
            console.log("✅ MATCHED! (string)");
            return true;
          }
          
          // ✅ KIỂM TRA ARRAY (multiple options)
          if (Array.isArray(variantValue) && variantValue.includes(option.id)) {
            console.log("✅ MATCHED! (array)");
            return true;
          }
        }
      }
    }
    
    console.log("❌ No measurement option selected");
    return false;
  };

  const addToCart = () => {
    if (product) {
      // ✅ KIỂM TRA NẾU CÓ CHỌN "MAY THEO SỐ ĐO"
      const isMeasurement = checkMeasurementOption(options);
      
      if (isMeasurement) {
        console.log("🎯 Phát hiện option 'May theo số đo' - Chuyển đến trang đặt lịch");
        setVisible(false);
        navigate("/measurement-appointment", {
          state: {
            product,
            selectedOptions: options,
          }
        });
        return; // Dừng lại, không thêm vào giỏ hàng
      }

      // ✅ LOGIC THÊM VÀO GIỎ HÀNG BÌNH THƯỜNG (không thay đổi)
      setCart((cart) => {
        let res = [...cart];
        if (selected) {
          const editing = cart.find(
            (item) =>
              item.product.id === product.id &&
              isIdentical(item.options, selected.options),
          )!;
          if (quantity === 0) {
            res.splice(cart.indexOf(editing), 1);
          } else {
            const existed = cart.find(
              (item, i) =>
                i !== cart.indexOf(editing) &&
                item.product.id === product.id &&
                isIdentical(item.options, options),
            )!;
            res.splice(cart.indexOf(editing), 1, {
              ...editing,
              options,
              quantity: existed ? existed.quantity + quantity : quantity,
            });
            if (existed) {
              res.splice(cart.indexOf(existed), 1);
            }
          }
        } else {
          const existed = cart.find(
            (item) =>
              item.product.id === product.id &&
              isIdentical(item.options, options),
          );
          if (existed) {
            res.splice(cart.indexOf(existed), 1, {
              ...existed,
              quantity: existed.quantity + quantity,
            });
          } else {
            res = res.concat({
              product,
              options,
              quantity,
            });
          }
        }
        return res;
      });
    }
    setVisible(false);
  };

  return (
    <>
      {children({
        open: () => setVisible(true),
        close: () => setVisible(false),
      })}
      {createPortal(
        <Sheet visible={visible} onClose={() => setVisible(false)} autoHeight>
          {product && (
            <Box className="space-y-6 mt-2" p={4}>
              <Box className="space-y-2">
                <Text.Title>{product.name}</Text.Title>
                <Text>
                  <FinalPrice options={options}>{product}</FinalPrice>
                </Text>
                <Text>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: product.description ?? "",
                    }}
                  ></div>
                </Text>
              </Box>
              <Box className="space-y-5">
                {product.variants &&
                  product.variants.map((variant) =>
                    variant.type === "single" ? (
                      <SingleOptionPicker
                        key={variant.id}
                        variant={variant}
                        value={options[variant.id] as string}
                        onChange={(selectedOption) =>
                          setOptions((prevOptions) => ({
                            ...prevOptions,
                            [variant.id]: selectedOption,
                          }))
                        }
                      />
                    ) : (
                      <MultipleOptionPicker
                        key={variant.id}
                        product={product}
                        variant={variant}
                        value={options[variant.id] as string[]}
                        onChange={(selectedOption) =>
                          setOptions((prevOptions) => ({
                            ...prevOptions,
                            [variant.id]: selectedOption,
                          }))
                        }
                      />
                    ),
                  )}
                <QuantityPicker value={quantity} onChange={setQuantity} />
                {selected ? (
                  <Button
                    variant={quantity > 0 ? "primary" : "secondary"}
                    type={quantity > 0 ? "highlight" : "neutral"}
                    fullWidth
                    onClick={addToCart}
                  >
                    {quantity > 0
                      ? selected
                        ? "Cập nhật giỏ hàng"
                        : "Thêm vào giỏ hàng"
                      : "Xoá"}
                  </Button>
                ) : (
                  <Button
                    disabled={!quantity}
                    variant="primary"
                    type="highlight"
                    fullWidth
                    onClick={addToCart}
                  >
                    {/* ✅ THAY ĐỔI TEXT NÚT NẾU LÀ "MAY THEO SỐ ĐO" */}
                    {checkMeasurementOption(options) 
                      ? "Đặt lịch đo may" 
                      : "Thêm vào giỏ hàng"
                    }
                  </Button>
                )}
              </Box>
            </Box>
          )}
        </Sheet>,
        document.body,
      )}
    </>
  );
};