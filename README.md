# 🚗 AutoWorth - Used Car Price Prediction

AutoWorth is a full-stack web application designed to predict the market value of used cars based on their specifications. It leverages a Machine Learning model trained on historical car data to provide accurate price estimates.

## Project Overview

Buying or selling a used car can be challenging due to the uncertainty of fair pricing. AutoWorth solves this by analyzing various parameters such as:
- **Vehicle Specifications**: Engine capacity, power, torque, dimensions.
- **Usage History**: Kilometers driven, number of previous owners.
- **Car Details**: Fuel type, transmission, drivetrain, seller type, and car age.

The application provides a user-friendly interface to input these details and get an instant price prediction.

## 🛠️ Tech Stack & Dependencies

The project is architected using a modern, scalable full-stack approach. Below is a detailed breakdown of the technologies used and the engineering rationale behind each choice.

### **Frontend (Client)**
*The presentation layer, focused on responsiveness and user experience.*

*   **React.js (v19)**:
    *   *Role*: Core UI Library.
    *   *Why*: Component-based architecture allows for reusable UI elements (like the Navbar and Form inputs). Its Virtual DOM ensures high performance even with frequent state updates (e.g., toggling between Light/Dark mode).
*   **Tailwind CSS**:
    *   *Role*: Styling Engine.
    *   *Why*: Utility-first approach significantly speeds up development by avoiding context switching between HTML and CSS files. It ensures a consistent design system and handles responsive breakpoints (mobile/desktop) out of the box.
*   **Framer Motion**:
    *   *Role*: Animation Library.
    *   *Why*: Adds polish to the UI with smooth page transitions and entry animations, enhancing the perceived quality of the application.
*   **React Router DOM**:
    *   *Role*: Client-Side Routing.
    *   *Why*: Enables a Single Page Application (SPA) feel where users can navigate between 'Home', 'Predict', and 'About' without triggering a full page reload.

### **Backend (Server)**
*The orchestration layer, managing API requests and bridging the gap between the Client and the ML Model.*

*   **Node.js & Express**:
    *   *Role*: Web Server & API Gateway.
    *   *Why*: Node.js's non-blocking I/O model is ideal for handling concurrent API requests. Express provides a minimal, unopinionated framework to structure routes (`/predict`, `/random-sample`) quickly.
*   **Child Process (`spawn`)**:
    *   *Role*: Inter-Process Communication (IPC).
    *   *Why*: Since the ML model is in Python, we need a way to invoke it from Node.js. `spawn` allows us to create a separate process for the Python script and communicate via standard streams (`stdin` for input, `stdout` for output), effectively bridging the two runtime environments.
*   **Cors**:
    *   *Role*: Security Middleware.
    *   *Why*: Enables Cross-Origin Resource Sharing, allowing the frontend (running on port 3000) to securely communicate with the backend (running on port 5001).

### **Machine Learning (Model)**
*The intelligence layer, responsible for data processing and price prediction.*

*   **Python (v3.9+)**:
    *   *Role*: Primary Language.
    *   *Why*: The de facto standard for Data Science with the richest ecosystem of libraries.
*   **Scikit-learn**:
    *   *Role*: Modeling Framework.
    *   *Why*: Provides robust implementations of classical ML algorithms. We used **Random Forest Regressor** because it handles non-linear data well, is robust to outliers, and requires less preprocessing (like scaling) compared to neural networks.
*   **Pandas**:
    *   *Role*: Data Manipulation.
    *   *Why*: Essential for loading CSV data, cleaning it (dropping nulls), and performing one-hot encoding on categorical variables (like Fuel Type).
*   **Joblib**:
    *   *Role*: Model Serialization.
    *   *Why*: More efficient than Python's built-in `pickle` for storing large NumPy arrays, allowing us to save the trained model to disk (`.pkl`) and load it instantly during inference.
*   **NumPy**:
    *   *Role*: Numerical Computing.
    *   *Why*: Underpins Pandas and Scikit-learn, handling the low-level matrix operations required for the model's calculations.

## 🔄 Workflow

The application follows a robust request-response architecture. Below is the high-level flow and a concrete example to illustrate how data moves through the system.

### **Architecture Flow**

1.  **User Input**: The user fills out a form on the React frontend with car details (e.g., Year, KM driven, Fuel Type).
2.  **API Request**: The frontend sends a `POST` request to the backend endpoint `/predict` with the form data.
3.  **Backend Processing**:
    *   The Express server receives the request.
    *   It spawns a Python child process using `spawn('python3', ['path/to/infer.py'])`.
    *   The input data is passed to the Python script via `stdin` (Standard Input).
4.  **Inference Execution**:
    *   The `infer.py` script starts up.
    *   It loads the pre-trained model (`car_price_model.pkl`) and the feature columns structure.
    *   It processes the input (converting JSON to DataFrame, handling one-hot encoding).
    *   The model predicts the price.
    *   The result is printed to `stdout` (Standard Output) as a JSON string.
5.  **Response**:
    *   The Node.js server captures the `stdout` data.
    *   It parses the JSON and sends the predicted price back to the frontend.
6.  **Display**: The frontend receives the price and displays it to the user formatted in INR (₹).

### **Scenario Example: Predicting a Swift Dzire**

Let's trace a specific request to see exactly what happens under the hood.

1.  **User Action**: A user wants to sell a **2018 Maruti Swift Dzire Diesel**. They enter:
    *   *Year*: 2018 (Calculated Car Age: 6 years)
    *   *Kilometers*: 50,000
    *   *Fuel*: Diesel
    *   *Transmission*: Manual
    *   *Owner*: First Owner

2.  **Frontend Payload**: The React app constructs a JSON object:
    ```json
    {
      "car_age": 6,
      "kilometer": 50000,
      "fuel_type": "Diesel",
      "transmission": "Manual",
      "owner": "First",
      ...
    }
    ```

3.  **Python Inference (Data Transformation)**:
    *   The Python script receives this JSON.
    *   **One-Hot Encoding**: It converts categorical values into the numeric format the model expects.
        *   `fuel_type` becomes: `fuel_type_Diesel = 1`, `fuel_type_Petrol = 0`, `fuel_type_CNG = 0`, etc.
        *   `transmission` becomes: `transmission_Manual = 1`.
    *   **Feature Alignment**: It ensures the order of columns matches *exactly* what the model was trained on (e.g., `[car_age, kilometer, fuel_type_Diesel, ...]`).

4.  **Model Prediction**:
    *   The Random Forest model takes this numeric vector.
    *   It traverses the decision trees based on the values (e.g., "Is car_age > 5?", "Is fuel_type_Diesel == 1?").
    *   The aggregated result is, say, `450000.0`.

5.  **Final Output**: The backend returns `{"predicted_price": 450000}` and the user sees **₹4,50,000**.

**Feature: Random Sample**
- The `/random-sample` endpoint runs `model/sample.py` to pick a random row from the dataset. This helps users quickly test the application without manually filling all fields.

## Challenges Faced (Interview Focus)

These are the key engineering challenges encountered during development and the rationale behind the solutions.

1.  **Cross-Language Interoperability (Node.js ↔ Python)**
    *   **Situation**: The application needed a performant web server (Node.js) but relied on a Python-based ML ecosystem for inference.
    *   **Task**: Establish a reliable, low-latency communication channel between the two runtimes.
    *   **Action**: Implemented a `child_process` architecture where Node.js spawns a Python script for each request. Data is marshalled via standard I/O streams (`stdin`/`stdout`) using JSON, which is language-agnostic.
    *   **Result**: This allowed us to leverage the best tools for each job (Express for API, Scikit-learn for ML) without complex middleware, though it introduces some latency (addressed in *Future Improvements*).

2.  **Handling Training vs. Inference Data Mismatch (Schema Evolution)**
    *   **Situation**: Machine learning models are rigid; they expect input features in a specific order and format. During training, categorical variables (like "Fuel Type") are one-hot encoded into multiple columns (e.g., `fuel_type_Diesel`, `fuel_type_Petrol`).
    *   **Task**: Ensure that a single user input (e.g., "Diesel") is correctly transformed into the exact multi-column vector the model expects during inference.
    *   **Action**: I persisted the *schema metadata* (column names and order) alongside the model artifact. The inference script loads this schema and dynamically aligns the input data, filling missing columns with 0s and ignoring unknown ones.
    *   **Result**: This prevents "Shape Mismatch" errors and ensures the model always receives valid input, even if the user skips optional fields.

3.  **Balancing Model Complexity and Performance**
    *   **Situation**: We needed a model that was accurate but also lightweight enough to run quickly on a standard server.
    *   **Task**: Choose an algorithm that handles non-linear relationships (common in price depreciation) without excessive computational cost.
    *   **Action**: Selected **Random Forest Regressor** over simple Linear Regression (too simple) or Deep Learning (too heavy). I used `RandomizedSearchCV` to fine-tune hyperparameters (depth, estimators) to prevent overfitting.
    *   **Result**: Achieved a strong R² score while keeping inference time under 2 seconds.

## Future Improvements & Scalability

If this project were to be moved to a production environment with high traffic, here is the roadmap for scaling.

1.  **Architectural Decoupling (Microservices Pattern)**
    *   **Current Bottleneck**: Spawning a new Python process for every request incurs significant overhead (loading Python interpreter + libraries + model ~2-3 seconds).
    *   **Solution**: Refactor the ML component into a persistent **Flask** or **FastAPI** microservice.
    *   **Benefit**: The model would be loaded into memory *once* at startup. Node.js would simply make a fast HTTP request to the Python service, reducing latency from seconds to milliseconds.

2.  **Containerization & Orchestration (DevOps)**
    *   **Action**: Create `Dockerfile`s for both the Client and Server/ML services. Use **Docker Compose** for local development and **Kubernetes** for production deployment.
    *   **Benefit**: Ensures consistent environments across dev/prod ("works on my machine" fix) and allows independent scaling (e.g., run 5 replicas of the ML service but only 2 of the web server).

3.  **Model Lifecycle Management (MLOps)**
    *   **Action**: Implement tools like **MLflow** or **Weights & Biases**.
    *   **Benefit**: To track experiments, version models, and monitor "Data Drift" (e.g., if the market shifts and 2018 cars become significantly cheaper, the model needs retraining).

4.  **Caching Strategy**
    *   **Action**: Implement **Redis** caching for identical requests.
    *   **Benefit**: If users frequently check prices for popular configurations (e.g., 2020 Swift Petrol), the result is served instantly from cache, reducing load on the ML service.

## 📂 Project Structure

```
AutoWorth/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # UI Components (Navbar, etc.)
│   │   └── App.js          # Main Application Logic
│   └── package.json        # Frontend dependencies
├── server/                 # Node.js Backend
│   ├── index.js            # Express Server entry point
│   └── package.json        # Backend dependencies
├── model/                  # Machine Learning
│   ├── train.py            # Script to train the model
│   ├── infer.py            # Script for inference
│   ├── sample.py           # Script to get random sample
│   └── car_price_model.pkl # Trained Model File
├── data/                   # Dataset files
│   └── processed_data.csv  # Cleaned data used for training
└── README.md               # Project Documentation
```

## 🏁 Getting Started

### Prerequisites
- Node.js & npm
- Python 3.9+

### Installation

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd AutoWorth
    ```

2.  **Setup Backend**
    ```bash
    cd server
    npm install
    ```

3.  **Setup Frontend**
    ```bash
    cd ../client
    npm install
    ```

4.  **Setup Python Environment**
    ```bash
    cd ..
    python3 -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    pip install -r requirements.txt
    ```

### Running the Application

1.  **Start the Backend** (from root)
    ```bash
    node server/index.js
    ```
2.  **Start the Frontend** (in a new terminal, from `client/` directory)
    ```bash
    cd client
    npm start
    ```

Access the application at `http://localhost:3000`.
