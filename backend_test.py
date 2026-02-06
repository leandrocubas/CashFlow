#!/usr/bin/env python3
"""
FluxoControl Backend API Testing Suite
Tests all endpoints for the cash flow management system
"""

import requests
import json
import sys
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

class FluxoControlAPITester:
    def __init__(self, base_url: str = "https://moneyflow-app-31.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_data = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test data storage
        self.created_category_id = None
        self.created_contact_id = None
        self.created_revenue_id = None
        self.created_expense_id = None

    def log_test(self, name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "name": name,
            "success": success,
            "details": details,
            "response_data": response_data
        })

    def make_request(self, method: str, endpoint: str, data: Dict = None, expected_status: int = 200) -> tuple:
        """Make HTTP request and return success status and response"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                return False, {"error": f"Unsupported method: {method}"}

            success = response.status_code == expected_status
            try:
                response_data = response.json()
            except:
                response_data = {"status_code": response.status_code, "text": response.text}

            return success, response_data

        except Exception as e:
            return False, {"error": str(e)}

    def test_auth_register(self):
        """Test user registration"""
        test_email = f"test_{datetime.now().strftime('%H%M%S')}@test.com"
        data = {
            "name": "Test User",
            "email": test_email,
            "password": "testpass123"
        }
        
        success, response = self.make_request('POST', 'auth/register', data, 200)
        
        if success and 'access_token' in response:
            self.log_test("User Registration", True, f"Created user: {test_email}")
            return True
        else:
            self.log_test("User Registration", False, f"Failed: {response}")
            return False

    def test_auth_login(self):
        """Test user login with provided credentials"""
        data = {
            "email": "admin@fluxocontrol.com",
            "password": "admin123"
        }
        
        success, response = self.make_request('POST', 'auth/login', data, 200)
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_data = response.get('user', {})
            self.log_test("User Login", True, f"Logged in as: {self.user_data.get('email', 'Unknown')}")
            return True
        else:
            self.log_test("User Login", False, f"Failed: {response}")
            return False

    def test_auth_me(self):
        """Test get current user"""
        if not self.token:
            self.log_test("Get Current User", False, "No token available")
            return False
            
        success, response = self.make_request('GET', 'auth/me', expected_status=200)
        
        if success and 'email' in response:
            self.log_test("Get Current User", True, f"User: {response.get('email')}")
            return True
        else:
            self.log_test("Get Current User", False, f"Failed: {response}")
            return False

    def test_categories_crud(self):
        """Test categories CRUD operations"""
        # Create category
        category_data = {
            "name": f"Test Category {datetime.now().strftime('%H%M%S')}",
            "type": "revenue"
        }
        
        success, response = self.make_request('POST', 'categories', category_data, 200)
        if success and 'id' in response:
            self.created_category_id = response['id']
            self.log_test("Create Category", True, f"Created: {response['name']}")
        else:
            self.log_test("Create Category", False, f"Failed: {response}")
            return False

        # Get categories
        success, response = self.make_request('GET', 'categories?type=revenue', expected_status=200)
        if success and isinstance(response, list):
            self.log_test("Get Categories", True, f"Found {len(response)} categories")
        else:
            self.log_test("Get Categories", False, f"Failed: {response}")

        # Delete category
        if self.created_category_id:
            success, response = self.make_request('DELETE', f'categories/{self.created_category_id}', expected_status=200)
            if success:
                self.log_test("Delete Category", True)
            else:
                self.log_test("Delete Category", False, f"Failed: {response}")

        return True

    def test_contacts_crud(self):
        """Test contacts CRUD operations"""
        # Create contact
        contact_data = {
            "name": f"Test Client {datetime.now().strftime('%H%M%S')}",
            "type": "client"
        }
        
        success, response = self.make_request('POST', 'contacts', contact_data, 200)
        if success and 'id' in response:
            self.created_contact_id = response['id']
            self.log_test("Create Contact", True, f"Created: {response['name']}")
        else:
            self.log_test("Create Contact", False, f"Failed: {response}")
            return False

        # Get contacts
        success, response = self.make_request('GET', 'contacts?type=client', expected_status=200)
        if success and isinstance(response, list):
            self.log_test("Get Contacts", True, f"Found {len(response)} contacts")
        else:
            self.log_test("Get Contacts", False, f"Failed: {response}")

        return True

    def test_revenues_crud(self):
        """Test revenues CRUD operations"""
        if not self.created_contact_id or not self.created_category_id:
            # Create minimal test data
            self.test_categories_crud()
            self.test_contacts_crud()

        # Create revenue
        revenue_data = {
            "name": f"Test Revenue {datetime.now().strftime('%H%M%S')}",
            "description": "Test revenue description",
            "contact_id": self.created_contact_id or "test-contact-id",
            "contact_name": "Test Client",
            "category_id": self.created_category_id or "test-category-id", 
            "category_name": "Test Category",
            "total_amount": 1000.00,
            "payment_type": "pix",
            "installments": 1,
            "payment_method": "PIX",
            "due_date": (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d'),
            "paid": False,
            "paid_amount": 0
        }
        
        success, response = self.make_request('POST', 'revenues', revenue_data, 200)
        if success and 'id' in response:
            self.created_revenue_id = response['id']
            self.log_test("Create Revenue", True, f"Created: {response['name']}")
        else:
            self.log_test("Create Revenue", False, f"Failed: {response}")
            return False

        # Get revenues
        success, response = self.make_request('GET', 'revenues', expected_status=200)
        if success and isinstance(response, list):
            self.log_test("Get Revenues", True, f"Found {len(response)} revenues")
        else:
            self.log_test("Get Revenues", False, f"Failed: {response}")

        # Update revenue
        if self.created_revenue_id:
            update_data = revenue_data.copy()
            update_data['paid'] = True
            update_data['paid_amount'] = 1000.00
            
            success, response = self.make_request('PUT', f'revenues/{self.created_revenue_id}', update_data, 200)
            if success:
                self.log_test("Update Revenue", True, "Marked as paid")
            else:
                self.log_test("Update Revenue", False, f"Failed: {response}")

        return True

    def test_expenses_crud(self):
        """Test expenses CRUD operations"""
        # Create expense category and supplier if needed
        expense_category_data = {
            "name": f"Test Expense Category {datetime.now().strftime('%H%M%S')}",
            "type": "expense"
        }
        
        success, response = self.make_request('POST', 'categories', expense_category_data, 200)
        expense_category_id = response.get('id') if success else "test-expense-category"

        supplier_data = {
            "name": f"Test Supplier {datetime.now().strftime('%H%M%S')}",
            "type": "supplier"
        }
        
        success, response = self.make_request('POST', 'contacts', supplier_data, 200)
        supplier_id = response.get('id') if success else "test-supplier"

        # Create expense
        expense_data = {
            "name": f"Test Expense {datetime.now().strftime('%H%M%S')}",
            "description": "Test expense description",
            "contact_id": supplier_id,
            "contact_name": "Test Supplier",
            "category_id": expense_category_id,
            "category_name": "Test Expense Category",
            "total_amount": 500.00,
            "expense_type": "variable",
            "payment_type": "pix",
            "installments": 1,
            "due_date": (datetime.now() + timedelta(days=15)).strftime('%Y-%m-%d'),
            "paid": False,
            "paid_amount": 0,
            "partial_payment": False
        }
        
        success, response = self.make_request('POST', 'expenses', expense_data, 200)
        if success and 'id' in response:
            self.created_expense_id = response['id']
            self.log_test("Create Expense", True, f"Created: {response['name']}")
        else:
            self.log_test("Create Expense", False, f"Failed: {response}")
            return False

        # Get expenses
        success, response = self.make_request('GET', 'expenses', expected_status=200)
        if success and isinstance(response, list):
            self.log_test("Get Expenses", True, f"Found {len(response)} expenses")
        else:
            self.log_test("Get Expenses", False, f"Failed: {response}")

        return True

    def test_dashboard_endpoints(self):
        """Test dashboard endpoints"""
        # Dashboard summary
        success, response = self.make_request('GET', 'dashboard/summary', expected_status=200)
        if success and 'cash_balance' in response:
            self.log_test("Dashboard Summary", True, f"Balance: R$ {response.get('cash_balance', 0):.2f}")
        else:
            self.log_test("Dashboard Summary", False, f"Failed: {response}")

        # Cashflow
        success, response = self.make_request('GET', 'dashboard/cashflow?months=6', expected_status=200)
        if success and isinstance(response, list):
            self.log_test("Dashboard Cashflow", True, f"Found {len(response)} months")
        else:
            self.log_test("Dashboard Cashflow", False, f"Failed: {response}")

        # DRE
        success, response = self.make_request('GET', 'dashboard/dre', expected_status=200)
        if success and 'total_revenue' in response:
            self.log_test("Dashboard DRE", True, f"Revenue: R$ {response.get('total_revenue', 0):.2f}")
        else:
            self.log_test("Dashboard DRE", False, f"Failed: {response}")

    def test_activities(self):
        """Test activity log"""
        success, response = self.make_request('GET', 'activities?limit=10', expected_status=200)
        if success and isinstance(response, list):
            self.log_test("Activity Log", True, f"Found {len(response)} activities")
        else:
            self.log_test("Activity Log", False, f"Failed: {response}")

    def test_reports(self):
        """Test report endpoints"""
        # By category
        success, response = self.make_request('GET', 'reports/by-category?type=revenue', expected_status=200)
        if success and isinstance(response, list):
            self.log_test("Reports by Category", True, f"Found {len(response)} categories")
        else:
            self.log_test("Reports by Category", False, f"Failed: {response}")

        # By contact
        success, response = self.make_request('GET', 'reports/by-contact?type=revenue', expected_status=200)
        if success and isinstance(response, list):
            self.log_test("Reports by Contact", True, f"Found {len(response)} contacts")
        else:
            self.log_test("Reports by Contact", False, f"Failed: {response}")

        # Monthly
        success, response = self.make_request('GET', 'reports/monthly', expected_status=200)
        if success and isinstance(response, list):
            self.log_test("Monthly Reports", True, f"Found {len(response)} months")
        else:
            self.log_test("Monthly Reports", False, f"Failed: {response}")

    def test_ai_analysis(self):
        """Test AI analysis endpoint"""
        ai_data = {
            "analysis_type": "recommendation",
            "period": "monthly"
        }
        
        success, response = self.make_request('POST', 'analysis/ai', ai_data, 200)
        if success and 'content' in response:
            self.log_test("AI Analysis", True, f"Generated analysis: {len(response.get('content', ''))} chars")
        else:
            self.log_test("AI Analysis", False, f"Failed: {response}")

    def test_protected_routes(self):
        """Test that protected routes require authentication"""
        # Save current token
        original_token = self.token
        self.token = None
        
        success, response = self.make_request('GET', 'dashboard/summary', expected_status=401)
        if response.get('status_code') == 401 or 'Token não fornecido' in str(response):
            self.log_test("Protected Routes", True, "Correctly requires authentication")
        else:
            self.log_test("Protected Routes", False, f"Should require authentication, got: {response}")
        
        # Restore token
        self.token = original_token

    def cleanup(self):
        """Clean up test data"""
        cleanup_count = 0
        
        # Delete created revenue
        if self.created_revenue_id:
            success, _ = self.make_request('DELETE', f'revenues/{self.created_revenue_id}', expected_status=200)
            if success:
                cleanup_count += 1

        # Delete created expense
        if self.created_expense_id:
            success, _ = self.make_request('DELETE', f'expenses/{self.created_expense_id}', expected_status=200)
            if success:
                cleanup_count += 1

        # Delete created contact
        if self.created_contact_id:
            success, _ = self.make_request('DELETE', f'contacts/{self.created_contact_id}', expected_status=200)
            if success:
                cleanup_count += 1

        print(f"🧹 Cleaned up {cleanup_count} test records")

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting FluxoControl API Tests")
        print(f"📍 Testing: {self.base_url}")
        print("=" * 50)

        # Authentication tests
        print("\n🔐 Authentication Tests")
        self.test_auth_register()
        
        if not self.test_auth_login():
            print("❌ Cannot proceed without login. Check credentials.")
            return False
            
        self.test_auth_me()
        self.test_protected_routes()

        # CRUD tests
        print("\n📊 CRUD Operations Tests")
        self.test_categories_crud()
        self.test_contacts_crud()
        self.test_revenues_crud()
        self.test_expenses_crud()

        # Dashboard tests
        print("\n📈 Dashboard Tests")
        self.test_dashboard_endpoints()
        self.test_activities()
        self.test_reports()

        # AI tests
        print("\n🤖 AI Analysis Tests")
        self.test_ai_analysis()

        # Cleanup
        print("\n🧹 Cleanup")
        self.cleanup()

        # Results
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return False

def main():
    """Main test runner"""
    tester = FluxoControlAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    results = {
        "timestamp": datetime.now().isoformat(),
        "total_tests": tester.tests_run,
        "passed_tests": tester.tests_passed,
        "success_rate": (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0,
        "test_details": tester.test_results
    }
    
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n📄 Detailed results saved to: /app/backend_test_results.json")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())