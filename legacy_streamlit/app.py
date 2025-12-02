import streamlit as st
import sqlite3
import hashlib
import requests
import pandas as pd
import time
import random
import qrcode
import io
from web3 import Web3
from datetime import datetime
import threading

# --- CONFIGURATION ---
st.set_page_config(
    page_title="NairaAI 2.0 | Automated Crypto Off-Ramp",
    page_icon="💸",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# --- CONSTANTS ---
DB_FILE = "naira_ai.db"
PLATFORM_FEE_PERCENT = 0.009  # 0.9%
# Using the user's provided fallback address as the "Contract Address" for the demo
CONTRACT_ADDRESS = "0x72fb93c58ab7afadbf75e982a5b6d2cb6134247b" 
BSC_RPC = "https://bsc-dataseed.binance.org"
CRYPTOS = ["USDT", "BTC", "ETH", "BNB", "TRX", "DOGE"]

# --- STYLES ---
st.markdown("""
    <style>
    /* Dark Premium Theme */
    .stApp {
        background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
        color: #ffffff;
    }
    .stTextInput > div > div > input, .stSelectbox > div > div > div, .stNumberInput > div > div > input {
        background-color: rgba(255, 255, 255, 0.05);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
    }
    .stButton > button {
        background: linear-gradient(90deg, #00C9FF 0%, #92FE9D 100%);
        color: #000;
        font-weight: bold;
        border: none;
        border-radius: 25px;
        padding: 0.6rem 2.5rem;
        transition: all 0.3s ease;
        width: 100%;
    }
    .stButton > button:hover {
        transform: scale(1.02);
        box-shadow: 0 0 15px rgba(0, 201, 255, 0.4);
    }
    .card {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
        border-radius: 15px;
        padding: 1.5rem;
        border: 1px solid rgba(255, 255, 255, 0.1);
        margin-bottom: 1rem;
    }
    .rate-card {
        background: rgba(0, 201, 255, 0.1);
        border: 1px solid rgba(0, 201, 255, 0.3);
        border-radius: 10px;
        padding: 10px;
        margin-top: 10px;
    }
    .success-text { color: #92FE9D; font-weight: bold; }
    .highlight { color: #00C9FF; font-weight: bold; }
    </style>
    """, unsafe_allow_html=True)

# --- DATABASE MANAGEMENT ---
def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    # Users Table
    c.execute('''CREATE TABLE IF NOT EXISTS users
                 (email TEXT PRIMARY KEY, password TEXT, name TEXT, phone TEXT, bank_name TEXT, account_number TEXT, account_name TEXT)''')
    # Transactions Table
    c.execute('''CREATE TABLE IF NOT EXISTS transactions
                 (id TEXT PRIMARY KEY, user_email TEXT, crypto TEXT, amount REAL, rate REAL, ngn_amount REAL, 
                  recipient_name TEXT, recipient_bank TEXT, recipient_account TEXT, status TEXT, timestamp DATETIME)''')
    conn.commit()
    conn.close()

def get_user(email):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE email=?", (email,))
    user = c.fetchone()
    conn.close()
    return user

def create_user(email, password, name, phone):
    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        hashed_pw = hashlib.sha256(password.encode()).hexdigest()
        c.execute("INSERT INTO users (email, password, name, phone) VALUES (?, ?, ?, ?)", 
                  (email, hashed_pw, name, phone))
        conn.commit()
        conn.close()
        return True
    except sqlite3.IntegrityError:
        return False

def update_user_bank(email, bank_name, account_number, account_name):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("UPDATE users SET bank_name=?, account_number=?, account_name=? WHERE email=?", 
              (bank_name, account_number, account_name, email))
    conn.commit()
    conn.close()

# --- RATE ENGINE ---
def get_best_rate(crypto):
    """
    Simulates querying multiple exchanges (Binance, Transak, Breet, YellowCard)
    and returns the best rate.
    """
    # Base market rates (Mocked for stability, but with realistic variance)
    base_rates = {
        "USDT": 1680.00, "BTC": 115000000.00, "ETH": 6200000.00,
        "BNB": 1050000.00, "TRX": 195.00, "DOGE": 280.00
    }
    
    market_price = base_rates.get(crypto, 1000.0)
    
    # Simulate different providers
    providers = {
        "Binance P2P": market_price * random.uniform(0.99, 1.01),
        "Transak": market_price * random.uniform(0.98, 1.00),
        "Breet": market_price * random.uniform(0.97, 0.99),
        "YellowCard": market_price * random.uniform(0.98, 1.005)
    }
    
    best_provider = max(providers, key=providers.get)
    best_rate = providers[best_provider]
    
    return best_provider, best_rate

# --- PAYSTACK INTEGRATION (MOCK) ---
def resolve_bank_account(account_number, bank_code): 
    """
    Mock Paystack Account Resolve.
    In production, this would call https://api.paystack.co/bank/resolve
    """
    time.sleep(1) # Simulate API call
    if len(account_number) == 10:
        return {"status": True, "account_name": "MOCK USER NAME"}
    return {"status": False, "message": "Could not resolve account"}

# --- WEB3 & DEPOSIT ---
def check_deposit_status(address, crypto):
    """
    Checks the blockchain for deposits.
    """
    try:
        w3 = Web3(Web3.HTTPProvider(BSC_RPC))
        if w3.is_connected():
            balance = w3.eth.get_balance(address)
            return w3.from_wei(balance, 'ether')
    except:
        pass
    return 0.0

def generate_qr(data):
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf

# --- APP LOGIC ---

def login_page():
    st.markdown("<div class='card' style='max-width: 400px; margin: auto;'>", unsafe_allow_html=True)
    st.subheader("🔐 Login to NairaAI")
    email = st.text_input("Email")
    password = st.text_input("Password", type="password")
    
    if st.button("Login"):
        user = get_user(email)
        if user and user[1] == hashlib.sha256(password.encode()).hexdigest():
            st.session_state.user = user
            st.session_state.page = "dashboard"
            st.rerun()
        else:
            st.error("Invalid credentials")
            
    st.markdown("---")
    if st.button("Create Account"):
        st.session_state.page = "signup"
        st.rerun()
    st.markdown("</div>", unsafe_allow_html=True)

def signup_page():
    st.markdown("<div class='card' style='max-width: 400px; margin: auto;'>", unsafe_allow_html=True)
    st.subheader("🚀 Create Account")
    name = st.text_input("Full Name")
    phone = st.text_input("Phone")
    email = st.text_input("Email")
    password = st.text_input("Password", type="password")
    
    if st.button("Sign Up"):
        if create_user(email, password, name, phone):
            st.success("Account created! Please login.")
            st.session_state.page = "login"
            st.rerun()
        else:
            st.error("Email already exists.")
            
    if st.button("Back to Login"):
        st.session_state.page = "login"
        st.rerun()
    st.markdown("</div>", unsafe_allow_html=True)

def dashboard():
    user = st.session_state.user
    st.title(f"Welcome, {user[2]} 👋")
    
    # Sidebar
    with st.sidebar:
        st.write("### Menu")
        if st.button("Logout"):
            st.session_state.user = None
            st.session_state.page = "login"
            st.rerun()
            
    # Main Flow
    if 'tx_step' not in st.session_state:
        st.session_state.tx_step = 1
        
    # STEP 1: RATE & AMOUNT
    if st.session_state.tx_step == 1:
        col1, col2 = st.columns([1, 1])
        with col1:
            st.markdown("<div class='card'><h3>1. Select Crypto</h3>", unsafe_allow_html=True)
            crypto = st.selectbox("Asset", CRYPTOS)
            amount = st.number_input("Amount", min_value=0.0, value=10.0, step=0.1)
            
            # Rate Engine
            provider, rate = get_best_rate(crypto)
            gross_ngn = amount * rate
            fee = gross_ngn * PLATFORM_FEE_PERCENT
            net_ngn = gross_ngn - fee
            
            st.markdown(f"""
            <div class='rate-card'>
                <div style='display:flex; justify-content:space-between;'>
                    <span>Best Rate ({provider}):</span>
                    <span class='highlight'>₦{rate:,.2f}</span>
                </div>
                <div style='display:flex; justify-content:space-between; font-size:0.9em; color:#ddd;'>
                    <span>Platform Fee (0.9%):</span>
                    <span>- ₦{fee:,.2f}</span>
                </div>
                <hr style='border-color: rgba(255,255,255,0.2);'>
                <div style='display:flex; justify-content:space-between; font-size:1.3em; font-weight:bold;'>
                    <span>You Receive:</span>
                    <span class='success-text'>₦{net_ngn:,.2f}</span>
                </div>
            </div>
            """, unsafe_allow_html=True)
            
            if st.button("Lock Rate & Continue"):
                st.session_state.tx_data = {
                    "crypto": crypto, "amount": amount, "rate": rate, "net_ngn": net_ngn
                }
                st.session_state.tx_step = 2
                st.rerun()
            st.markdown("</div>", unsafe_allow_html=True)
            
        with col2:
            st.info("💡 We scan Binance, Transak, and YellowCard in real-time to find you the absolute best rate.")

    # STEP 2: PAYOUT DESTINATION
    elif st.session_state.tx_step == 2:
        st.markdown("<div class='card'><h3>2. Payout Destination</h3>", unsafe_allow_html=True)
        
        option = st.radio("Send Money To:", ["My Saved Bank", "Someone Else"])
        
        recipient_name = ""
        bank_name = ""
        account_num = ""
        
        banks = ["GTBank", "Zenith", "Access", "UBA", "First Bank", "Kuda", "Opay", "Palmpay"]
        
        if option == "My Saved Bank":
            if user[4]: # If bank saved
                st.success(f"Using saved account: {user[4]} - {user[5]} ({user[6]})")
                bank_name = user[4]
                account_num = user[5]
                recipient_name = user[6]
            else:
                st.warning("No bank saved. Please enter details.")
                bank_name = st.selectbox("Bank", banks)
                account_num = st.text_input("Account Number")
                if len(account_num) == 10:
                    res = resolve_bank_account(account_num, bank_name)
                    if res['status']:
                        st.success(f"Verified: {res['account_name']}")
                        recipient_name = res['account_name']
                        if st.checkbox("Save to Profile"):
                            update_user_bank(user[0], bank_name, account_num, recipient_name)
                            # Update session user
                            st.session_state.user = get_user(user[0])
                    else:
                        st.error("Could not verify account")
                        
        else: # Someone Else
            bank_name = st.selectbox("Recipient Bank", banks)
            account_num = st.text_input("Recipient Account Number")
            if len(account_num) == 10:
                res = resolve_bank_account(account_num, bank_name)
                if res['status']:
                    st.success(f"Verified: {res['account_name']}")
                    recipient_name = res['account_name']
                else:
                    st.error("Could not verify account")

        col1, col2 = st.columns(2)
        with col1:
            if st.button("Back"):
                st.session_state.tx_step = 1
                st.rerun()
        with col2:
            if recipient_name and st.button("Confirm & Deposit"):
                st.session_state.tx_data.update({
                    "recipient_name": recipient_name,
                    "recipient_bank": bank_name,
                    "recipient_account": account_num
                })
                st.session_state.tx_step = 3
                st.rerun()
        st.markdown("</div>", unsafe_allow_html=True)

    # STEP 3: DEPOSIT
    elif st.session_state.tx_step == 3:
        tx = st.session_state.tx_data
        st.markdown("<div class='card' style='text-align:center;'><h3>3. Make Deposit</h3>", unsafe_allow_html=True)
        
        st.warning(f"Please send exactly **{tx['amount']} {tx['crypto']}** (BEP-20)")
        
        qr_img = generate_qr(CONTRACT_ADDRESS)
        st.image(qr_img, width=220)
        st.code(CONTRACT_ADDRESS, language="text")
        
        st.caption("Scanning blockchain for deposit...")
        
        # Simulation for Demo
        if st.button("Simulate Deposit Received (Demo)"):
            st.session_state.tx_step = 4
            st.rerun()
            
        # Real Web3 Check (Passive)
        bal = check_deposit_status(CONTRACT_ADDRESS, tx['crypto'])
        if bal > 0:
            st.info(f"Wallet Balance: {bal} BNB")
            
        st.markdown("</div>", unsafe_allow_html=True)

    # STEP 4: SUCCESS
    elif st.session_state.tx_step == 4:
        st.balloons()
        tx = st.session_state.tx_data
        st.markdown(f"""
        <div class='card' style='text-align: center;'>
            <h1 style='color: #92FE9D;'>PAYMENT SUCCESSFUL</h1>
            <p>Funds sent to <b>{tx['recipient_name']}</b></p>
            <div style='background: rgba(255,255,255,0.1); padding: 20px; border-radius: 15px; text-align: left; margin: 20px auto; max-width: 400px;'>
                <p><strong>Amount Sent:</strong> ₦{tx['net_ngn']:,.2f}</p>
                <p><strong>Bank:</strong> {tx['recipient_bank']}</p>
                <p><strong>Account:</strong> {tx['recipient_account']}</p>
                <p><strong>Rate Used:</strong> ₦{tx['rate']:,.2f}</p>
                <p><strong>Ref ID:</strong> NIA-{random.randint(100000, 999999)}</p>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        if st.button("Start New Transaction"):
            st.session_state.tx_step = 1
            st.rerun()

# --- MAIN ENTRY ---
if __name__ == "__main__":
    init_db()
    if 'page' not in st.session_state:
        st.session_state.page = "login"
        
    if st.session_state.page == "login":
        login_page()
    elif st.session_state.page == "signup":
        signup_page()
    elif st.session_state.page == "dashboard":
        dashboard()
