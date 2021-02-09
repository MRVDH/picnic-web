export default {
    processCartContents (cart) {
        if (!cart.items || !cart.items.length) {
            return cart;
        }

        for (let item of cart.items) {
            for (let i = 0; i < item.items.length; i++) {
                let subItem = item.items[i];

                subItem._quantity = subItem.decorators.find(x => x.type === "QUANTITY").quantity;
                subItem._totalPrice = item.price;
                subItem._hidePrice = item.items.length > 1 && i !== item.items.length - 1;

                if (item.decorators && item.decorators.length) {
                    if (item.decorators.find(x => x.type === "PRICE")) {
                        subItem._discountPrice = item.decorators.find(x => x.type === "PRICE").display_price;
                    }

                    if (item.decorators.find(x => x.type === "LABEL")) {
                        subItem._labelText = item.decorators.find(x => x.type === "LABEL").text.toLowerCase();
                    }
                }
            }
        }

        return cart;
    }
}