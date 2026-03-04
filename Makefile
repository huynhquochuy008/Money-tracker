# Makefile for Money-tracker

# Variables
BACKEND_DIR = backend
FRONTEND_DIR = frontend
VENV = venv
PYTHON = $(VENV)/bin/python
NPM = npm

.PHONY: help install run run-backend run-frontend test test-backend test-frontend build-frontend clean

help: ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies for both backend and frontend
	@echo "Installing backend dependencies..."
	@if [ ! -f "$(PYTHON)" ]; then \
		echo "Creating virtual environment..."; \
		rm -rf $(VENV); \
		python3 -m venv $(VENV) || { \
			echo "ERROR: Failed to create virtual environment."; \
			echo "On Debian/Ubuntu, you may need to install the 'python3-venv' package."; \
			echo "Run: sudo apt update && sudo apt install python3.11-venv"; \
			exit 1; \
		}; \
	fi
	@echo "Ensuring pip is installed..."
	@$(PYTHON) -m ensurepip --upgrade || echo "Pip already exists or ensurepip not available."
	@echo "Installing backend packages..."
	@$(PYTHON) -m pip install --upgrade pip
	@$(PYTHON) -m pip install -r $(BACKEND_DIR)/requirements.txt
	@echo "Installing frontend dependencies..."
	@cd $(FRONTEND_DIR) && $(NPM) install

run: ## Run both backend and frontend concurrently
	@echo "Starting backend and frontend..."
	@$(MAKE) -j 2 run-backend run-frontend

run-backend: ## Run the Flask backend
	@echo "Starting backend..."
	@cd $(BACKEND_DIR) && ../$(PYTHON) app.py

run-frontend: ## Run the Vite frontend
	@echo "Starting frontend..."
	@cd $(FRONTEND_DIR) && $(NPM) run dev

test: ## Run all tests
	@$(MAKE) test-backend
	@$(MAKE) test-frontend

test-backend: ## Run backend tests
	@echo "Running backend tests..."
	@PYTHONPATH=.:$(BACKEND_DIR) SUPABASE_URL=http://mock SUPABASE_KEY=mock SUPABASE_USER_ID=test-user $(PYTHON) -m pytest $(BACKEND_DIR)/tests

test-frontend: ## Run frontend tests
	@echo "Running frontend tests..."
	@cd $(FRONTEND_DIR) && $(NPM) run test

build-frontend: ## Build frontend for production
	@echo "Building frontend..."
	@cd $(FRONTEND_DIR) && $(NPM) run build

clean: ## Clean up temporary files
	@echo "Cleaning up..."
	@find . -type d -name "__pycache__" -exec rm -rf {} +
	@find . -type d -name ".pytest_cache" -exec rm -rf {} +
	@rm -rf $(FRONTEND_DIR)/dist
	@rm -rf $(FRONTEND_DIR)/node_modules
	@rm -rf $(VENV)
