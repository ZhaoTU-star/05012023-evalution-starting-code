const API = (() => {
  const URL = "http://localhost:3000";
  const getCart = () => {
    // define your method to get cart data
    fetch(`URL/cart`).then((data) => data.json());
  };

  const getInventory = () => {
    // define your method to get inventory data
    fetch(`URL/inventory`).then((data) => data.json());
  };

  const addToCart = (inventoryItem) => {
    // define your method to add an item to cart
    fetch(`URL/cart`, {
      method: "POST",
      body: JSON.stringify({
        id: inventoryItem.id,
        content: inventoryItem.content,
        amount: inventoryItem.amount,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    }).then((data) => data.json());
  };

  const updateCart = (id, newAmount) => {
    // define your method to update an item in cart
    fetch(`URL/cart/${id}`, {
      method: "PUT",
      body: JSON.stringify({amount: newAmount}),
      headers: {
        "Content-Type": "application/json",
      },
    }).then((data) => data.json());
  };

  const deleteFromCart = (id) => {
    // define your method to delete an item in cart
    fetch(`URL/cart/${id}`, {
      method: "DELETE",
    }).then((data) => data.json());
  };

  const checkout = () => {
    // you don't need to add anything here
    return getCart().then((data) =>
      Promise.all(data.map((item) => deleteFromCart(item.id)))
    );
  };

  return {
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
  };
})();

const Model = (() => {
  // implement your logic for Model
  class State {
    #onChange;
    #inventory;
    #cart;
    constructor() {
      this.#inventory = [];
      this.#cart = [];
    }
    getCart() {
      return this.#cart;
    }

    getInventory() {
      return this.#inventory;
    }

    setCart(newCart) {
      this.#cart = newCart;
      // update view
      // this.#onChange();
    }
    setInventory(newInventory) {
      this.#inventory = newInventory;
    }

    // Function to add an item to the cart
    addToCart(item, amount) {
      const existingItem = this.getCart().find((cartItem) => cartItem.id === item.id);

      if (existingItem) {
        existingItem.amount += amount;
      } else {
        const newItem = {
          id: item.id,
          name: item.name,
          amount: amount,
        };

        this.getCart().push(newItem);
      }
    }

    // Function to remove an item from the cart
    removeFromCart(item) {
      const index = this.getCart().findIndex((cartItem) => cartItem.id === item.id);
      if (index > -1) {
        this.getCart().splice(index, 1);
      }
    }

    // Function to clear the cart
    clearCart() {
      this.setCart([]);
    }

    // Function to update the server with the current state of the cart
    updateServerCart() {
      try {
        const cartData = JSON.stringify(this.getCart());
        const response = fetch('http://localhost:3000/cart', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: cartData,
        });
        const data = response.json();
        this.setCart(data);
      } catch (error) {
        console.error(error);
      }
    }

    subscribe(cb) {}
  }
  const {
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
  } = API;
  return {
    State,
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
  };
})();

const View = (() => {
  // implement your logic for View
  const inventoryList = document.querySelector(".inventory-container ul");
  const cartList = document.querySelector(".cart-container ul");
  const checkoutBtn = document.querySelector(".checkout-btn");
  const cartTotal = document.querySelector(".cart-container .cart-wrapper");
  

  const bindAddToCart = (handler) => {
    inventoryList.addEventListener("click", (event) => {
      if (event.target.classList.contains("add-to-cart")) {
        const id = parseInt(event.target.parentNode.getAttribute("data-id"));
        const amount = parseInt(
          event.target.parentNode.querySelector(".amount").value
        );
        handler(id, amount);
      }
    });
  }

  const bindDeleteFromCart = (handler) => {
    cartList.addEventListener("click", (event) => {
      if (event.target.classList.contains("delete")) {
        const id = parseInt(
          event.target.parentNode.parentNode.getAttribute("data-id")
        );
        handler(id);
      }
    });
  }

  const bindCheckout = (handler) => {
    checkoutBtn.addEventListener("click", () => {
      handler();
    });
  }

  const renderInventory = (inventory) =>{
    inventoryList.innerHTML = "";
    inventory.forEach((item) => {
      const listItem = document.createElement("li");
      listItem.setAttribute("data-id", item.id);
      listItem.innerHTML = `
        <div>
          <span>${item.name}</span>
          <input class="amount" type="number" min="1" value="1">
          <button class="add-to-cart">Add to cart</button>
        </div>
      `;
      inventoryList.appendChild(listItem);
    });
  }

  const renderCart = (cart) => {
    cartList.innerHTML = "";
    cart.forEach((item) => {
      const listItem = document.createElement("li");
      listItem.setAttribute("data-id", item.id);
      listItem.innerHTML = `
        <div>
          <span>${item.name}</span>
          <span>${item.amount}</span>
          <button class="delete">Delete</button>
        </div>
      `;
      cartList.appendChild(listItem);
    });
  }

  const renderCartTotal = (total) =>{
    cartTotal.innerHTML = `$${total}`;
  }
  
  

  return {
    bindAddToCart,
    bindDeleteFromCart,
    bindCheckout,
    renderInventory,
    renderCart,
    renderCartTotal,
    inventoryList,
    cartList,
    checkoutBtn,
    cartTotal
  };
})();

const Controller = ((model, view) => {
  // implement your logic for Controller
  const state = new model.State();

  const init = () => {
    try {
      // fetch initial data from server
      const inventoryData = state.getInventory();
      const cartData = state.getCart();

      // set initial state
      state.setInventory(inventoryData);
      state.setCart(cartData);

      // render initial view
      view.renderInventory(inventoryData);
      view.renderCart(cartData);

      // add event listeners
      // view.bindUpdateAmount(handleUpdateAmount);
      view.bindAddToCart(handleAddToCart);
      view.bindDeleteFromCart(handleDelete);
      view.bindCheckout(handleCheckout);
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateAmount = (itemId, newAmount) => {
    try {
      // update state
      state.updateCart(itemId, newAmount);

      // render updated view
      view.renderCart(state.getCart());
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddToCart = (itemId, amount) => {
    try {
      // check if item already in cart
      const existingItem = state.getCartItemById(itemId);

      if (existingItem) {
        // update existing item
        state.updateCart(itemId, existingItem.amount + amount);
      } else {
        // add new item
        const item = state.getInventoryItem(itemId);

        if (!item) {
          throw new Error(`Item with id ${itemId} does not exist in inventory`);
        }

        state.addToCart({ ...item, amount });
      }

      // render updated view
      view.renderCart(state.getCart());
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = (itemId) => {
    try {
      // delete item from state
      state.deleteFromCart(itemId);

      // render updated view
      view.renderCart(state.getCart());
    } catch (error) {
      console.error(error);
    }
  };

  const handleCheckout = () => {
    try {
      // delete all items from cart
      state.clearCart();

      // render updated view
      view.renderCart(state.getCart());
    } catch (error) {
      console.error(error);
    }
  };
  
  const bootstrap = () => {
    init();
  };
  return {
    bootstrap,
  };
})(Model, View);

Controller.bootstrap();
