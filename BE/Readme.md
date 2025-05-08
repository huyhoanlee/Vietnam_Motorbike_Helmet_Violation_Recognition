# HVDS_BE (Helmet Violation Detection System)

**HVDS_BE** is a Django-based backend application that forms part of the Helmet Violation Detection System (HVDS). This application handles functionalities related to cameras, violations, citizens, and notifications, while providing APIs for interaction with the frontend or other services.

## Folder Structure

The `HVDS_BE` folder contains the following key files:

- **data.xlsx**: An Excel file with 4 sheets containing initial data used to populate the database on first startup:
  - `Location`: Data about locations.
  - `Camera`: Data about cameras.
  - `ViolationStatus`: Data about violation statuses.
  - `Account`: Data about user accounts.
- **db.sqlite3**: SQLite database storing all application data.
- **pytest.ini**: Configuration file for running tests with `pytest`.
- **manage.py**: Main file for managing and running the Django application.
- **script/apis.txt**: Contains commands and notes about APIs to assist development.

### Modules in the `HVDS_BE` Folder

The project consists of 13 modules (subfolders), each managing a specific aspect of the system:

- **accounts**: Manages roles (`Admin` and `Supervisor`) and user accounts.
- **camera_urls**: Manages camera URLs.
- **cameras**: Controls camera information and status.
- **car_parrots**: Manages citizen registrations (assumed to handle vehicle-related data).
- **citizens**: Manages citizen information.
- **locations**: Manages camera locations.
- **mails**: Handles email functionalities (assumed for notifications).
- **notifications**: Manages email notifications for violations sent to citizens.
- **vehicles**: Manages vehicle information.
- **violations**: Manages violation records.
- **violation_status**: Manages the status of violations.
- **violation_images**: Manages images related to violations.

## Guides

### Running the Application

You can run the `HVDS_BE` application in two ways:

#### 1. Using Docker

To run the application in a Docker container, follow these steps:

- Ensure Docker is installed on your system.
- Build and run the container with the following commands:

```bash
docker build -t hvds_be .
docker run -p 7860:7860 hvds_be
```

- Access the application at `http://localhost:7860`.

#### 2. Using Uvicorn

To run the application directly without Docker, use `uvicorn`:

- Install the project dependencies:

```bash
pip install -r requirements.txt
```

- Start the server with:

```bash
uvicorn HVDS_BE.asgi:application --host 0.0.0.0 --port 7860
```

- Access the application at `http://localhost:7860`.

### Running Pytest to Test APIs

To execute API tests using `pytest`, follow these steps:

1. Ensure `pytest` and required dependencies are installed:

```bash
pip install pytest pytest-django
```

2. Run the tests with:

```bash
pytest
```

- `pytest` will automatically discover and execute tests based on the configuration in `pytest.ini`.

## Requirements

- **Python**: 3.8 or higher
- **Django**: 3.2 or higher
- **Other Dependencies**: Listed in `requirements.txt`

## Notes

- Ensure the `data.xlsx` file is properly configured with valid data in the `Location`, `Camera`, `ViolationStatus`, and `Account` sheets for initial database setup.
- The `script/apis.txt` file provides useful API commands and notes for development and debugging.