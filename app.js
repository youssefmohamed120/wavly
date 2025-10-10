// ====================== منتجات المتجر ======================
const PRODUCTS = [
  { id: 'cap-black', title: 'Blue Cap 1', price: 200, img:'imegs/1.jpg'},
  { id: 'cap-white', title: 'Red Cap 2', price: 200, img:'imegs/2.jpg'},
  { id: 'cap-blue', title: 'Black Cap 3', price: 200, img:'imegs/3.jpg'},
];


// ====================== عرض المنتجات ======================
const productsEl = document.getElementById('products');
function renderProducts() {
  productsEl.innerHTML = '';
  PRODUCTS.forEach(p => {
    const fakePrice = Math.round(p.price * 1.3); // السعر الوهمي

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
     <img loading="lazy" src="${p.img}" alt="${p.title}" 
     style="width:100%;height:250px;object-fit:contain;background-color:#0b1220;border-radius:10px;">

      <h3>${p.title}</h3>

      <div class="price">
        <span class="old-price">${fakePrice} EGP</span><br>
        <span class="new-price">${p.price} EGP</span>
      </div>

      <div style="display:flex;gap:8px;margin-top:8px;">
        <button class="btn ghost" data-id="${p.id}">عرض</button>
        <button class="btn primary" data-add="${p.id}">أضف للسلة</button>
      </div>
    `;
    productsEl.appendChild(card);
  });
}
renderProducts();


 

// ====================== إدارة السلة ======================
const CART_KEY = 'wavly_cart_v1';
function getCart(){ try { return JSON.parse(localStorage.getItem(CART_KEY)) || {}; } catch(e){ return {}; } }
function setCart(c){ localStorage.setItem(CART_KEY, JSON.stringify(c)); updateCartCount(); }
function addToCart(id){ const cart = getCart(); cart[id] = (cart[id] || 0) + 1; setCart(cart); showToast('أضيف إلى السلة'); }
function removeFromCart(id){ const cart = getCart(); delete cart[id]; setCart(cart); }
function changeQty(id, qty){ const cart = getCart(); if(qty <= 0) delete cart[id]; else cart[id] = qty; setCart(cart); }
function updateCartCount(){ const cart = getCart(); const count = Object.values(cart).reduce((s,n)=>s+n,0); document.getElementById('cart-count').textContent = count; }
updateCartCount();

// ====================== أحداث الضغط ======================
document.addEventListener('click', (e) => {
  if(e.target.matches('[data-add]')) addToCart(e.target.getAttribute('data-add'));
  else if(e.target.matches('[data-id]')) {
    const id = e.target.getAttribute('data-id');
    const p = PRODUCTS.find(x=>x.id===id);
     
  }
});

// ====================== Toast ======================
function showToast(msg, t=1500){
  let toast = document.getElementById('wavly-toast');
  if(!toast){ 
    toast = document.createElement('div'); 
    toast.id='wavly-toast'; 
    Object.assign(toast.style,{
      position:'fixed',
      left:'20px',
      bottom:'20px',
      background:'#111b2e',
      padding:'10px 14px',
      borderRadius:'8px',
      color:'#fff',
      zIndex:2000
    });
    document.body.appendChild(toast);
  }
  toast.textContent = msg; 
  toast.style.opacity = '1'; 
  setTimeout(()=> toast.style.opacity='0', t);
}

// ====================== مودال السلة ======================
const cartModal = document.getElementById('cart-modal');
document.getElementById('open-cart').addEventListener('click', ()=>{ renderCartItems(); cartModal.classList.remove('hidden'); });
document.getElementById('close-cart').addEventListener('click', ()=> cartModal.classList.add('hidden'));

function renderCartItems(){
  const container = document.getElementById('cart-items');
  const cart = getCart();
  container.innerHTML = '';
  const ids = Object.keys(cart);
  if(ids.length === 0){ container.innerHTML = '<div class="muted">السلة فارغة</div>'; document.getElementById('cart-total').textContent = '0'; return; }
  let total = 0;
  ids.forEach(id=>{
    const p = PRODUCTS.find(x=>x.id===id);
    const qty = cart[id];
    total += p.price * qty;
    const div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = `
      <img src="${p.img}" alt="${p.title}" style="width:60px;height:50px;object-fit:cover">
      <div style="flex:1;display:inline-block;margin-right:10px">
        <div>${p.title}</div>
        <div class="muted">${p.price} EGP</div>
      </div>
      <div class="quantity" style="display:inline-block;margin-right:10px">
        <button data-dec="${id}">-</button>
        <span>${qty}</span>
        <button data-inc="${id}">+</button>
      </div>
      <button class="btn ghost" data-remove="${id}">حذف</button>
    `;
    container.appendChild(div);
  });
  document.getElementById('cart-total').textContent = total;
}

// تعديل الكميات وحذف العناصر
document.getElementById('cart-items').addEventListener('click', (e)=>{
  if(e.target.matches('[data-inc]')){ const id=e.target.getAttribute('data-inc'); changeQty(id,getCart()[id]+1); renderCartItems(); updateCartCount(); }
  else if(e.target.matches('[data-dec]')){ const id=e.target.getAttribute('data-dec'); changeQty(id,getCart()[id]-1); renderCartItems(); updateCartCount(); }
  else if(e.target.matches('[data-remove]')){ removeFromCart(e.target.getAttribute('data-remove')); renderCartItems(); updateCartCount(); }
});

// فتح وغلق Checkout
document.getElementById('go-checkout').addEventListener('click', ()=> {
  const cart = getCart();
  if(Object.keys(cart).length===0){ showToast('السلة فارغة'); return; }
  document.getElementById('checkout-modal').classList.remove('hidden');
});
document.getElementById('close-checkout').addEventListener('click', ()=> document.getElementById('checkout-modal').classList.add('hidden'));

// ====================== Checkout باستخدام EmailJS ======================
document.getElementById('checkout-form').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const fd = new FormData(e.target);
  const cart = getCart();
  const msg = document.getElementById('checkout-msg');
  msg.textContent = 'جاري إرسال الطلب...';

  // تجهيز بيانات الطلب
  const cartItems = Object.keys(cart).map(id=>{
    const p = PRODUCTS.find(x=>x.id===id);
    return `${p.title} x ${cart[id]} = ${p.price*cart[id]} EGP`;
  }).join('\n');

  const totalAmount = Object.keys(cart).reduce((sum,id)=>{
    const p = PRODUCTS.find(x=>x.id===id);
    return sum + (p.price*cart[id]);
  },0);

 const templateParams = {
  user_name: fd.get('customerName'),
  user_email: fd.get('customerEmail'),
  user_mobile: fd.get('customerMobile'),
  address: fd.get('address'),
  cart_items: cartItems,
  total_amount: totalAmount
};

  try {
    await emailjs.send('service_099ey3g', 'template_1ai2cok', templateParams);
    msg.textContent = 'تم إرسال الطلب بنجاح. شكرًا!';
    showToast('طلبك تم بنجاح!');
    localStorage.removeItem(CART_KEY);
    updateCartCount();
    document.getElementById('checkout-modal').classList.add('hidden');
  } catch(err){
    console.error(err);
    msg.textContent = 'فشل إرسال البريد. حاول مرة أخرى.';
  }
});


// ====================== مودال عرض المنتج ======================
const productModal = document.getElementById('product-modal');
const productImg = document.getElementById('product-img');
const productTitle = document.getElementById('product-title');
const productPrice = document.getElementById('product-price');
const addToCartBtn = document.getElementById('add-to-cart-btn');
const closeProduct = document.getElementById('close-product');

document.addEventListener('click', (e) => {
  if(e.target.matches('[data-id]')) {
    const id = e.target.getAttribute('data-id');
    const p = PRODUCTS.find(x=>x.id===id);

    // عرض بيانات المنتج في المودال
    productImg.src = p.img;
    productImg.alt = p.title;
    productTitle.textContent = p.title;
    productPrice.textContent = `${p.price} EGP`;
    addToCartBtn.setAttribute('data-add', id);

    productModal.classList.remove('hidden');
  }
});

// غلق المودال
closeProduct.addEventListener('click', ()=> productModal.classList.add('hidden'));
productModal.addEventListener('click', (e)=>{
  if(e.target === productModal) productModal.classList.add('hidden');
});
