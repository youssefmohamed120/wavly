const orderButtons = document.querySelectorAll(".order-btn");
const form = document.getElementById("orderForm");
const regionSelect = document.getElementById("region");
const shippingCostDisplay = document.getElementById("shippingCost");
const invoice = document.getElementById("invoice");

const coupons = {
  "SAVE20": { discount: 20, expiry: "2025-08-15" },
  "AUG10": { discount: 10, expiry: "2025-08-10" },
  "FREESHIP": { discount: 50, expiry: "2025-08-31" }
};

const shippingPrices = {
  "cairo": 35,
  "sadat-city": 40,
  "Helwan University": 50,
  "King Salman University": 60,
  "Another": 100
};

// مصفوفة المنتجات المختارة
let cart = [];

// عند الضغط على أي زرار "Order"
orderButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const cap = btn.parentElement;
    const productName = cap.getAttribute("data-name");
    const productPrice = parseInt(cap.getAttribute("data-price"));

    // لو المنتج موجود، زوّد الكمية
    const existing = cart.find(p => p.name === productName);
    if (existing) {
      existing.qty++;
    } else {
      cart.push({ name: productName, price: productPrice, qty: 1 });
    }

    updateCartDisplay();
    form.classList.remove("hidden");
    invoice.classList.add("hidden");
  });
});

// عرض مصاريف الشحن
regionSelect.addEventListener("change", () => {
  const region = regionSelect.value;
  if (shippingPrices[region]) {
    shippingCostDisplay.textContent = `📦 مصاريف الشحن: ${shippingPrices[region]} جنيهّ`;
  }
});

// تحديث عرض المنتجات في الفورم
function updateCartDisplay() {
  const container = document.getElementById("productsContainer");
  container.innerHTML = "";
  cart.forEach((item, index) => {
    container.innerHTML += `
      <div class="product">
        <p>${item.name} - ${item.price} جنيه</p>
        <button type="button" onclick="changeQty(${index}, -1)">➖</button>
        <span>${item.qty}</span>
        <button type="button" onclick="changeQty(${index}, 1)">➕</button>
      </div>
    `;
  });
}

// تغيير الكمية
function changeQty(index, change) {
  cart[index].qty += change;
  if (cart[index].qty <= 0) {
    cart.splice(index, 1);
  }
  updateCartDisplay();
}

// عند إرسال الفورم
form.addEventListener("submit", function(e) {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const phone = document.getElementById("phone").value;
  const address = document.getElementById("address").value;
  const region = regionSelect.value;
  const shipping = shippingPrices[region] || 0;

  // كوبون الخصم
  const couponCode = document.getElementById("coupon").value.trim().toUpperCase();
  let discount = 0;

  if (couponCode && coupons[couponCode]) {
    const today = new Date();
    const expiryDate = new Date(coupons[couponCode].expiry);
    if (today <= expiryDate) {
      discount = coupons[couponCode].discount;
    } else {
      alert("❌ كود الخصم منتهي الصلاحية");
    }
  } else if (couponCode) {
    alert("❌ كود الخصم غير صحيح");
  }

  // حساب الإجمالي
  let productsListHTML = "";
  let totalBeforeDiscount = 0;
  cart.forEach(item => {
    const subtotal = item.price * item.qty;
    totalBeforeDiscount += subtotal;
    productsListHTML += `<p>${item.name} - ${item.price} × ${item.qty} = ${subtotal} EGP</p>`;
  });

  totalBeforeDiscount += shipping;
  const total = Math.max(totalBeforeDiscount - discount, 0);

  // تجهيز البيانات للإرسال
  const templateParams = {
    user_name: name,
    user_phone: phone,
    user_address: address,
    region: region,
    products: JSON.stringify(cart),
    shipping: shipping,
    discount: discount,
    coupon_code: couponCode,
    total: total
  };

  console.log("بيانات هتتبعت:", templateParams);

  emailjs.send("service_zhqzk68","template_ptptwbr", templateParams,"PDD64lZbijtiyOxUn")
    .then(function(response) {
      console.log("SUCCESS!", response.status, response.text);
      invoice.innerHTML = `
        <h3>✅SUCCESS!</h3>
        <p>👤 Name: ${name}</p>
        <p>📞 Phone: ${phone}</p>
        <p>📍 Address: ${address} - ${region}</p>
        ${productsListHTML}
        <p>📦 Shipping: ${shipping} EGP</p>
        <hr>
        <p><strong>Total: ${total} EGP</strong></p>
      `;
      invoice.classList.remove("hidden");
      form.classList.add("hidden");
      cart = []; // تفريغ السلة
    }, function(error) {
      console.log("FAILED...", error);
      alert("حدث خطأ أثناء إرسال الطلب. حاول تاني.");
    });
});
