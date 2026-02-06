from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
from dateutil.relativedelta import relativedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'fluxocontrol-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Create the main app
app = FastAPI(title="FluxoControl API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ========== MODELS ==========

class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class CategoryBase(BaseModel):
    name: str
    type: str  # 'revenue' or 'expense'

class Category(CategoryBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ContactBase(BaseModel):
    name: str
    type: str  # 'client' or 'supplier'

class Contact(ContactBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class InstallmentInfo(BaseModel):
    installment_number: int
    total_installments: int
    amount: float
    due_date: str
    paid: bool = False
    paid_date: Optional[str] = None

class RevenueBase(BaseModel):
    name: str
    description: Optional[str] = ""
    contact_id: str
    contact_name: str
    category_id: str
    category_name: str
    total_amount: float
    payment_type: str  # 'pix', 'ted', 'cash', 'credit_card', 'installment'
    installments: int = 1
    payment_method: Optional[str] = ""
    due_date: str
    paid: bool = False
    paid_date: Optional[str] = None
    paid_amount: float = 0

class Revenue(RevenueBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    installment_details: List[InstallmentInfo] = []

class ExpenseBase(BaseModel):
    name: str
    description: Optional[str] = ""
    contact_id: str
    contact_name: str
    category_id: str
    category_name: str
    total_amount: float
    expense_type: str  # 'fixed' or 'variable'
    payment_type: str  # 'pix', 'ted', 'cash', 'credit_card', 'installment'
    installments: int = 1
    due_date: str
    paid: bool = False
    paid_date: Optional[str] = None
    paid_amount: float = 0
    partial_payment: bool = False

class Expense(ExpenseBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    installment_details: List[InstallmentInfo] = []

class ActivityLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    action: str
    entity_type: str
    entity_id: str
    entity_name: str
    user_id: str
    user_name: str
    details: Optional[str] = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AIAnalysisRequest(BaseModel):
    analysis_type: str  # 'projection', 'trend', 'recommendation'
    period: Optional[str] = "monthly"

# ========== AUTH HELPERS ==========

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(token: str = None):
    if not token:
        raise HTTPException(status_code=401, detail="Token não fornecido")
    try:
        if token.startswith("Bearer "):
            token = token[7:]
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password": 0})
        if not user:
            raise HTTPException(status_code=401, detail="Usuário não encontrado")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

# Helper to generate installments
def generate_installments(total_amount: float, num_installments: int, start_date: str) -> List[dict]:
    installments = []
    installment_amount = round(total_amount / num_installments, 2)
    start = datetime.fromisoformat(start_date.replace('Z', '+00:00') if 'Z' in start_date else start_date)
    
    for i in range(num_installments):
        due_date = start + relativedelta(months=i)
        installments.append({
            "installment_number": i + 1,
            "total_installments": num_installments,
            "amount": installment_amount,
            "due_date": due_date.isoformat(),
            "paid": False,
            "paid_date": None
        })
    return installments

# Helper to log activity
async def log_activity(action: str, entity_type: str, entity_id: str, entity_name: str, user: dict, details: str = ""):
    activity = ActivityLog(
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        entity_name=entity_name,
        user_id=user.get("id", "system"),
        user_name=user.get("name", "Sistema"),
        details=details
    )
    doc = activity.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.activity_logs.insert_one(doc)

# ========== AUTH ROUTES ==========

@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    user = User(email=user_data.email, name=user_data.name)
    doc = user.model_dump()
    doc['password'] = hash_password(user_data.password)
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.users.insert_one(doc)
    token = create_token(user.id, user.email)
    
    return Token(
        access_token=token,
        user={"id": user.id, "email": user.email, "name": user.name}
    )

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user['password']):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    
    token = create_token(user['id'], user['email'])
    return Token(
        access_token=token,
        user={"id": user['id'], "email": user['email'], "name": user['name']}
    )

@api_router.get("/auth/me")
async def get_me(authorization: str = Header(None)):
    user = await get_current_user(authorization)
    return user

# ========== CATEGORIES ROUTES ==========

@api_router.get("/categories", response_model=List[Category])
async def get_categories(type: Optional[str] = None):
    query = {}
    if type:
        query["type"] = type
    categories = await db.categories.find(query, {"_id": 0}).to_list(1000)
    for cat in categories:
        if isinstance(cat.get('created_at'), str):
            cat['created_at'] = datetime.fromisoformat(cat['created_at'])
    return categories

@api_router.post("/categories", response_model=Category)
async def create_category(category_data: CategoryBase, authorization: str = Header(None)):
    user = await get_current_user(authorization)
    
    existing = await db.categories.find_one({"name": category_data.name, "type": category_data.type})
    if existing:
        return Category(**{k: v for k, v in existing.items() if k != '_id'})
    
    category = Category(**category_data.model_dump())
    doc = category.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.categories.insert_one(doc)
    await log_activity("create", "category", category.id, category.name, user)
    return category

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str, authorization: str = None):
    user = await get_current_user(authorization)
    result = await db.categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    await log_activity("delete", "category", category_id, "", user)
    return {"message": "Categoria deletada"}

# ========== CONTACTS ROUTES ==========

@api_router.get("/contacts", response_model=List[Contact])
async def get_contacts(type: Optional[str] = None):
    query = {}
    if type:
        query["type"] = type
    contacts = await db.contacts.find(query, {"_id": 0}).to_list(1000)
    for contact in contacts:
        if isinstance(contact.get('created_at'), str):
            contact['created_at'] = datetime.fromisoformat(contact['created_at'])
    return contacts

@api_router.post("/contacts", response_model=Contact)
async def create_contact(contact_data: ContactBase, authorization: str = None):
    user = await get_current_user(authorization)
    
    existing = await db.contacts.find_one({"name": contact_data.name, "type": contact_data.type})
    if existing:
        return Contact(**{k: v for k, v in existing.items() if k != '_id'})
    
    contact = Contact(**contact_data.model_dump())
    doc = contact.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.contacts.insert_one(doc)
    await log_activity("create", "contact", contact.id, contact.name, user)
    return contact

@api_router.delete("/contacts/{contact_id}")
async def delete_contact(contact_id: str, authorization: str = None):
    user = await get_current_user(authorization)
    result = await db.contacts.delete_one({"id": contact_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Contato não encontrado")
    await log_activity("delete", "contact", contact_id, "", user)
    return {"message": "Contato deletado"}

# ========== REVENUES ROUTES ==========

@api_router.get("/revenues", response_model=List[Revenue])
async def get_revenues(paid: Optional[bool] = None, start_date: Optional[str] = None, end_date: Optional[str] = None):
    query = {}
    if paid is not None:
        query["paid"] = paid
    if start_date:
        query["due_date"] = {"$gte": start_date}
    if end_date:
        query.setdefault("due_date", {})["$lte"] = end_date
    
    revenues = await db.revenues.find(query, {"_id": 0}).sort("due_date", -1).to_list(1000)
    for rev in revenues:
        if isinstance(rev.get('created_at'), str):
            rev['created_at'] = datetime.fromisoformat(rev['created_at'])
        if isinstance(rev.get('updated_at'), str):
            rev['updated_at'] = datetime.fromisoformat(rev['updated_at'])
    return revenues

@api_router.post("/revenues", response_model=Revenue)
async def create_revenue(revenue_data: RevenueBase, authorization: str = None):
    user = await get_current_user(authorization)
    
    revenue = Revenue(**revenue_data.model_dump())
    
    if revenue_data.installments > 1:
        revenue.installment_details = generate_installments(
            revenue_data.total_amount,
            revenue_data.installments,
            revenue_data.due_date
        )
    
    doc = revenue.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    
    await db.revenues.insert_one(doc)
    await log_activity("create", "revenue", revenue.id, revenue.name, user, f"Valor: R$ {revenue.total_amount:.2f}")
    return revenue

@api_router.put("/revenues/{revenue_id}", response_model=Revenue)
async def update_revenue(revenue_id: str, revenue_data: RevenueBase, authorization: str = None):
    user = await get_current_user(authorization)
    
    existing = await db.revenues.find_one({"id": revenue_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Receita não encontrada")
    
    update_data = revenue_data.model_dump()
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    if revenue_data.installments > 1:
        update_data['installment_details'] = generate_installments(
            revenue_data.total_amount,
            revenue_data.installments,
            revenue_data.due_date
        )
    
    await db.revenues.update_one({"id": revenue_id}, {"$set": update_data})
    await log_activity("update", "revenue", revenue_id, revenue_data.name, user)
    
    updated = await db.revenues.find_one({"id": revenue_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    if isinstance(updated.get('updated_at'), str):
        updated['updated_at'] = datetime.fromisoformat(updated['updated_at'])
    return Revenue(**updated)

@api_router.delete("/revenues/{revenue_id}")
async def delete_revenue(revenue_id: str, authorization: str = None):
    user = await get_current_user(authorization)
    result = await db.revenues.delete_one({"id": revenue_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Receita não encontrada")
    await log_activity("delete", "revenue", revenue_id, "", user)
    return {"message": "Receita deletada"}

# ========== EXPENSES ROUTES ==========

@api_router.get("/expenses", response_model=List[Expense])
async def get_expenses(paid: Optional[bool] = None, expense_type: Optional[str] = None, start_date: Optional[str] = None, end_date: Optional[str] = None):
    query = {}
    if paid is not None:
        query["paid"] = paid
    if expense_type:
        query["expense_type"] = expense_type
    if start_date:
        query["due_date"] = {"$gte": start_date}
    if end_date:
        query.setdefault("due_date", {})["$lte"] = end_date
    
    expenses = await db.expenses.find(query, {"_id": 0}).sort("due_date", -1).to_list(1000)
    for exp in expenses:
        if isinstance(exp.get('created_at'), str):
            exp['created_at'] = datetime.fromisoformat(exp['created_at'])
        if isinstance(exp.get('updated_at'), str):
            exp['updated_at'] = datetime.fromisoformat(exp['updated_at'])
    return expenses

@api_router.post("/expenses", response_model=Expense)
async def create_expense(expense_data: ExpenseBase, authorization: str = None):
    user = await get_current_user(authorization)
    
    expense = Expense(**expense_data.model_dump())
    
    if expense_data.installments > 1:
        expense.installment_details = generate_installments(
            expense_data.total_amount,
            expense_data.installments,
            expense_data.due_date
        )
    
    doc = expense.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    
    await db.expenses.insert_one(doc)
    await log_activity("create", "expense", expense.id, expense.name, user, f"Valor: R$ {expense.total_amount:.2f}")
    return expense

@api_router.put("/expenses/{expense_id}", response_model=Expense)
async def update_expense(expense_id: str, expense_data: ExpenseBase, authorization: str = None):
    user = await get_current_user(authorization)
    
    existing = await db.expenses.find_one({"id": expense_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Despesa não encontrada")
    
    update_data = expense_data.model_dump()
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    if expense_data.installments > 1:
        update_data['installment_details'] = generate_installments(
            expense_data.total_amount,
            expense_data.installments,
            expense_data.due_date
        )
    
    await db.expenses.update_one({"id": expense_id}, {"$set": update_data})
    await log_activity("update", "expense", expense_id, expense_data.name, user)
    
    updated = await db.expenses.find_one({"id": expense_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    if isinstance(updated.get('updated_at'), str):
        updated['updated_at'] = datetime.fromisoformat(updated['updated_at'])
    return Expense(**updated)

@api_router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str, authorization: str = None):
    user = await get_current_user(authorization)
    result = await db.expenses.delete_one({"id": expense_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Despesa não encontrada")
    await log_activity("delete", "expense", expense_id, "", user)
    return {"message": "Despesa deletada"}

# ========== DASHBOARD ROUTES ==========

@api_router.get("/dashboard/summary")
async def get_dashboard_summary(authorization: str = None):
    await get_current_user(authorization)
    
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Total revenues
    revenues = await db.revenues.find({}, {"_id": 0}).to_list(10000)
    total_revenue_expected = sum(r.get('total_amount', 0) for r in revenues)
    total_revenue_paid = sum(r.get('paid_amount', 0) for r in revenues if r.get('paid'))
    
    # Total expenses
    expenses = await db.expenses.find({}, {"_id": 0}).to_list(10000)
    total_expense_expected = sum(e.get('total_amount', 0) for e in expenses)
    total_expense_paid = sum(e.get('paid_amount', 0) for e in expenses if e.get('paid'))
    
    # Overdue revenues
    overdue_revenues = [r for r in revenues if not r.get('paid') and r.get('due_date', '') < today]
    overdue_revenue_amount = sum(r.get('total_amount', 0) - r.get('paid_amount', 0) for r in overdue_revenues)
    
    # Overdue expenses
    overdue_expenses = [e for e in expenses if not e.get('paid') and e.get('due_date', '') < today]
    overdue_expense_amount = sum(e.get('total_amount', 0) - e.get('paid_amount', 0) for e in overdue_expenses)
    
    # Cash balance
    cash_balance = total_revenue_paid - total_expense_paid
    
    # Pending to receive
    pending_revenue = total_revenue_expected - total_revenue_paid
    
    # Pending to pay
    pending_expense = total_expense_expected - total_expense_paid
    
    return {
        "total_revenue_expected": total_revenue_expected,
        "total_revenue_paid": total_revenue_paid,
        "total_expense_expected": total_expense_expected,
        "total_expense_paid": total_expense_paid,
        "cash_balance": cash_balance,
        "pending_revenue": pending_revenue,
        "pending_expense": pending_expense,
        "overdue_revenue_count": len(overdue_revenues),
        "overdue_revenue_amount": overdue_revenue_amount,
        "overdue_expense_count": len(overdue_expenses),
        "overdue_expense_amount": overdue_expense_amount,
        "overdue_revenues": overdue_revenues[:5],
        "overdue_expenses": overdue_expenses[:5]
    }

@api_router.get("/dashboard/cashflow")
async def get_cashflow(months: int = 6, authorization: str = None):
    await get_current_user(authorization)
    
    today = datetime.now(timezone.utc)
    start_date = (today - relativedelta(months=months//2)).replace(day=1)
    end_date = (today + relativedelta(months=months//2 + 1)).replace(day=1)
    
    revenues = await db.revenues.find({
        "due_date": {"$gte": start_date.strftime("%Y-%m-%d"), "$lt": end_date.strftime("%Y-%m-%d")}
    }, {"_id": 0}).to_list(10000)
    
    expenses = await db.expenses.find({
        "due_date": {"$gte": start_date.strftime("%Y-%m-%d"), "$lt": end_date.strftime("%Y-%m-%d")}
    }, {"_id": 0}).to_list(10000)
    
    # Group by month
    cashflow = {}
    current = start_date
    while current < end_date:
        month_key = current.strftime("%Y-%m")
        cashflow[month_key] = {
            "month": current.strftime("%b/%Y"),
            "revenue_expected": 0,
            "revenue_paid": 0,
            "expense_expected": 0,
            "expense_paid": 0,
            "balance": 0
        }
        current += relativedelta(months=1)
    
    for rev in revenues:
        due_date = rev.get('due_date', '')[:7]
        if due_date in cashflow:
            cashflow[due_date]['revenue_expected'] += rev.get('total_amount', 0)
            if rev.get('paid'):
                cashflow[due_date]['revenue_paid'] += rev.get('paid_amount', 0)
    
    for exp in expenses:
        due_date = exp.get('due_date', '')[:7]
        if due_date in cashflow:
            cashflow[due_date]['expense_expected'] += exp.get('total_amount', 0)
            if exp.get('paid'):
                cashflow[due_date]['expense_paid'] += exp.get('paid_amount', 0)
    
    # Calculate balance
    for key in cashflow:
        cashflow[key]['balance'] = cashflow[key]['revenue_paid'] - cashflow[key]['expense_paid']
    
    return list(cashflow.values())

@api_router.get("/dashboard/dre")
async def get_dre(authorization: str = None):
    await get_current_user(authorization)
    
    today = datetime.now(timezone.utc)
    start_of_month = today.replace(day=1).strftime("%Y-%m-%d")
    end_of_month = (today.replace(day=1) + relativedelta(months=1) - timedelta(days=1)).strftime("%Y-%m-%d")
    
    revenues = await db.revenues.find({
        "due_date": {"$gte": start_of_month, "$lte": end_of_month}
    }, {"_id": 0}).to_list(10000)
    
    expenses = await db.expenses.find({
        "due_date": {"$gte": start_of_month, "$lte": end_of_month}
    }, {"_id": 0}).to_list(10000)
    
    # Group revenues by category
    revenue_by_category = {}
    for rev in revenues:
        cat = rev.get('category_name', 'Outros')
        if cat not in revenue_by_category:
            revenue_by_category[cat] = 0
        revenue_by_category[cat] += rev.get('paid_amount', 0) if rev.get('paid') else 0
    
    # Group expenses by type
    fixed_expenses = sum(e.get('paid_amount', 0) if e.get('paid') else 0 for e in expenses if e.get('expense_type') == 'fixed')
    variable_expenses = sum(e.get('paid_amount', 0) if e.get('paid') else 0 for e in expenses if e.get('expense_type') == 'variable')
    
    total_revenue = sum(revenue_by_category.values())
    total_expenses = fixed_expenses + variable_expenses
    gross_profit = total_revenue - variable_expenses
    net_profit = total_revenue - total_expenses
    
    return {
        "period": f"{today.strftime('%B/%Y')}",
        "total_revenue": total_revenue,
        "revenue_by_category": revenue_by_category,
        "fixed_expenses": fixed_expenses,
        "variable_expenses": variable_expenses,
        "total_expenses": total_expenses,
        "gross_profit": gross_profit,
        "net_profit": net_profit,
        "gross_margin": (gross_profit / total_revenue * 100) if total_revenue > 0 else 0,
        "net_margin": (net_profit / total_revenue * 100) if total_revenue > 0 else 0
    }

# ========== ACTIVITY LOG ROUTES ==========

@api_router.get("/activities")
async def get_activities(limit: int = 20, authorization: str = None):
    await get_current_user(authorization)
    activities = await db.activity_logs.find({}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    for act in activities:
        if isinstance(act.get('created_at'), str):
            act['created_at'] = datetime.fromisoformat(act['created_at'])
    return activities

# ========== AI ANALYSIS ROUTES ==========

@api_router.post("/analysis/ai")
async def get_ai_analysis(request: AIAnalysisRequest, authorization: str = None):
    await get_current_user(authorization)
    
    emergent_key = os.environ.get('EMERGENT_LLM_KEY')
    if not emergent_key:
        raise HTTPException(status_code=500, detail="Chave de API não configurada")
    
    # Gather financial data
    revenues = await db.revenues.find({}, {"_id": 0}).to_list(1000)
    expenses = await db.expenses.find({}, {"_id": 0}).to_list(1000)
    
    total_revenue = sum(r.get('total_amount', 0) for r in revenues)
    total_paid_revenue = sum(r.get('paid_amount', 0) for r in revenues if r.get('paid'))
    total_expense = sum(e.get('total_amount', 0) for e in expenses)
    total_paid_expense = sum(e.get('paid_amount', 0) for e in expenses if e.get('paid'))
    
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    overdue_revenues = len([r for r in revenues if not r.get('paid') and r.get('due_date', '') < today])
    overdue_expenses = len([e for e in expenses if not e.get('paid') and e.get('due_date', '') < today])
    
    financial_context = f"""
    Dados Financeiros da Empresa:
    - Receita Total Prevista: R$ {total_revenue:,.2f}
    - Receita Recebida: R$ {total_paid_revenue:,.2f}
    - Despesa Total Prevista: R$ {total_expense:,.2f}
    - Despesa Paga: R$ {total_paid_expense:,.2f}
    - Saldo Atual: R$ {total_paid_revenue - total_paid_expense:,.2f}
    - Receitas Atrasadas: {overdue_revenues}
    - Despesas Atrasadas: {overdue_expenses}
    - Total de Transações de Receita: {len(revenues)}
    - Total de Transações de Despesa: {len(expenses)}
    """
    
    prompts = {
        "projection": f"""
        {financial_context}
        
        Com base nesses dados financeiros, faça uma projeção para os próximos 3 meses.
        Considere tendências de receitas e despesas. Forneça insights sobre:
        1. Projeção de receita
        2. Projeção de despesas
        3. Saldo projetado
        4. Riscos identificados
        
        Responda em português de forma concisa e objetiva.
        """,
        "trend": f"""
        {financial_context}
        
        Analise as tendências financeiras da empresa. Identifique:
        1. Padrões de receita
        2. Padrões de despesa
        3. Sazonalidades (se identificáveis)
        4. Pontos de atenção
        
        Responda em português de forma concisa e objetiva.
        """,
        "recommendation": f"""
        {financial_context}
        
        Com base na situação financeira atual, forneça recomendações práticas para:
        1. Melhorar o fluxo de caixa
        2. Reduzir inadimplência
        3. Otimizar despesas
        4. Aumentar receitas
        
        Responda em português de forma concisa e objetiva.
        """
    }
    
    prompt = prompts.get(request.analysis_type, prompts["recommendation"])
    
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        chat = LlmChat(
            api_key=emergent_key,
            session_id=f"analysis-{uuid.uuid4()}",
            system_message="Você é um analista financeiro especializado em fluxo de caixa empresarial. Forneça análises precisas e recomendações práticas."
        ).with_model("openai", "gpt-5.2")
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        return {
            "analysis_type": request.analysis_type,
            "content": response,
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        logger.error(f"AI Analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro na análise: {str(e)}")

# ========== REPORTS ROUTES ==========

@api_router.get("/reports/by-category")
async def get_report_by_category(type: str = "revenue", authorization: str = None):
    await get_current_user(authorization)
    
    if type == "revenue":
        items = await db.revenues.find({}, {"_id": 0}).to_list(10000)
    else:
        items = await db.expenses.find({}, {"_id": 0}).to_list(10000)
    
    by_category = {}
    for item in items:
        cat = item.get('category_name', 'Outros')
        if cat not in by_category:
            by_category[cat] = {"name": cat, "total": 0, "paid": 0, "count": 0}
        by_category[cat]['total'] += item.get('total_amount', 0)
        by_category[cat]['paid'] += item.get('paid_amount', 0) if item.get('paid') else 0
        by_category[cat]['count'] += 1
    
    return list(by_category.values())

@api_router.get("/reports/by-contact")
async def get_report_by_contact(type: str = "revenue", authorization: str = None):
    await get_current_user(authorization)
    
    if type == "revenue":
        items = await db.revenues.find({}, {"_id": 0}).to_list(10000)
    else:
        items = await db.expenses.find({}, {"_id": 0}).to_list(10000)
    
    by_contact = {}
    for item in items:
        contact = item.get('contact_name', 'Outros')
        if contact not in by_contact:
            by_contact[contact] = {"name": contact, "total": 0, "paid": 0, "count": 0}
        by_contact[contact]['total'] += item.get('total_amount', 0)
        by_contact[contact]['paid'] += item.get('paid_amount', 0) if item.get('paid') else 0
        by_contact[contact]['count'] += 1
    
    return list(by_contact.values())

@api_router.get("/reports/monthly")
async def get_monthly_report(year: int = None, authorization: str = None):
    await get_current_user(authorization)
    
    if not year:
        year = datetime.now(timezone.utc).year
    
    revenues = await db.revenues.find({
        "due_date": {"$regex": f"^{year}"}
    }, {"_id": 0}).to_list(10000)
    
    expenses = await db.expenses.find({
        "due_date": {"$regex": f"^{year}"}
    }, {"_id": 0}).to_list(10000)
    
    monthly = {}
    for month in range(1, 13):
        month_key = f"{year}-{month:02d}"
        monthly[month_key] = {
            "month": month_key,
            "revenue_total": 0,
            "revenue_paid": 0,
            "expense_total": 0,
            "expense_paid": 0,
            "balance": 0
        }
    
    for rev in revenues:
        month_key = rev.get('due_date', '')[:7]
        if month_key in monthly:
            monthly[month_key]['revenue_total'] += rev.get('total_amount', 0)
            if rev.get('paid'):
                monthly[month_key]['revenue_paid'] += rev.get('paid_amount', 0)
    
    for exp in expenses:
        month_key = exp.get('due_date', '')[:7]
        if month_key in monthly:
            monthly[month_key]['expense_total'] += exp.get('total_amount', 0)
            if exp.get('paid'):
                monthly[month_key]['expense_paid'] += exp.get('paid_amount', 0)
    
    for key in monthly:
        monthly[key]['balance'] = monthly[key]['revenue_paid'] - monthly[key]['expense_paid']
    
    return list(monthly.values())

# Root endpoint
@api_router.get("/")
async def root():
    return {"message": "FluxoControl API", "version": "1.0.0"}

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
