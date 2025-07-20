#!/bin/bash
# deploy.sh - Build and deployment scripts for OpenShift

set -e

# Configuration
APP_NAME="aqi-breathe-ui"
NAMESPACE="aqi-breathe-ui"  # Update with your OpenShift project
IMAGE_REGISTRY="image-registry.openshift-image-registry.svc:5000"
GIT_REPO="https://github.com/dineshcpandey/aqi-breathe-ui.git"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${BLUE}==== $1 ====${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if logged into OpenShift
check_oc_login() {
    if ! oc whoami >/dev/null 2>&1; then
        print_error "Not logged into OpenShift. Please run 'oc login' first."
        exit 1
    fi
    print_success "OpenShift login verified: $(oc whoami)"
}

# Function to check if project exists
check_project() {
    if ! oc project $NAMESPACE >/dev/null 2>&1; then
        print_warning "Project $NAMESPACE doesn't exist. Creating it..."
        oc new-project $NAMESPACE --display-name="AQI Mapping Platform" --description="Air Quality Index visualization platform"
        print_success "Project $NAMESPACE created"
    else
        oc project $NAMESPACE
        print_success "Using project: $NAMESPACE"
    fi
}

# Function to generate data before deployment
generate_data() {
    print_step "Generating AQI data"
    
    if [ -f "compatible-data-generator.js" ]; then
        node compatible-data-generator.js
        print_success "Data generation completed"
        
        # Verify generated files
        if [ -d "generated_data" ] && [ -f "generated_data/current_reading.csv" ]; then
            print_success "Generated data files verified"
            ls -la generated_data/
        else
            print_error "Generated data files not found"
            exit 1
        fi
    else
        print_warning "Data generator not found. Skipping data generation."
    fi
}

# Function to build Docker image locally (for testing)
build_local() {
    print_step "Building Docker image locally"
    
    generate_data
    
    docker build -t $APP_NAME:latest .
    print_success "Local Docker build completed"
    
    # Test the container
    print_step "Testing local container"
    docker run -d --name $APP_NAME-test -p 8080:8080 $APP_NAME:latest
    sleep 10
    
    if curl -f http://localhost:8080/health >/dev/null 2>&1; then
        print_success "Local container health check passed"
    else
        print_error "Local container health check failed"
    fi
    
    docker stop $APP_NAME-test
    docker rm $APP_NAME-test
}

# Function to deploy to OpenShift
deploy_openshift() {
    print_step "Deploying to OpenShift"
    
    check_oc_login
    check_project
    
    # Apply the deployment configuration
    if [ -f "openshift-deployment.yaml" ]; then
        # Update the deployment with correct namespace and registry
        sed "s/your-project-namespace/$NAMESPACE/g" openshift-deployment.yaml | \
        sed "s|https://github.com/your-username/aqi-mapping-platform.git|$GIT_REPO|g" | \
        oc apply -f -
        
        print_success "Deployment configuration applied"
    else
        print_error "openshift-deployment.yaml not found"
        exit 1
    fi
    
    # Wait for build to complete
    print_step "Waiting for build to complete"
    oc logs -f bc/$APP_NAME || true
    
    # Wait for deployment
    print_step "Waiting for deployment to complete"
    oc rollout status dc/$APP_NAME --timeout=600s
    
    # Get the route URL
    ROUTE_URL=$(oc get route $APP_NAME -o jsonpath='{.spec.host}' 2>/dev/null || echo "")
    if [ -n "$ROUTE_URL" ]; then
        print_success "Application deployed successfully!"
        echo -e "${GREEN}URL: https://$ROUTE_URL${NC}"
    else
        print_warning "Route not found. Check deployment status."
    fi
}

# Function to create OpenShift resources from template
deploy_from_template() {
    print_step "Deploying from OpenShift template"
    
    check_oc_login
    check_project
    
    # Create the application from Git repository
    oc new-app --name=$APP_NAME \
        --image-stream=nodejs:18-ubi8 \
        $GIT_REPO \
        --strategy=docker
    
    # Expose the service
    oc expose svc/$APP_NAME
    
    # Set resource limits
    oc set resources dc/$APP_NAME --limits=cpu=500m,memory=512Mi --requests=cpu=100m,memory=128Mi
    
    # Add health checks
    oc set probe dc/$APP_NAME --liveness --get-url=http://:8080/health --initial-delay-seconds=30
    oc set probe dc/$APP_NAME --readiness --get-url=http://:8080/ready --initial-delay-seconds=5
    
    print_success "Template deployment completed"
    
    # Get the route URL
    ROUTE_URL=$(oc get route $APP_NAME -o jsonpath='{.spec.host}')
    print_success "Application URL: https://$ROUTE_URL"
}

# Function to check deployment status
status() {
    print_step "Checking deployment status"
    
    check_oc_login
    oc project $NAMESPACE >/dev/null 2>&1 || { print_error "Project $NAMESPACE not found"; exit 1; }
    
    echo -e "\n${BLUE}Deployment Status:${NC}"
    oc get dc/$APP_NAME -o wide 2>/dev/null || print_warning "DeploymentConfig not found"
    
    echo -e "\n${BLUE}Pods:${NC}"
    oc get pods -l app=$APP_NAME
    
    echo -e "\n${BLUE}Services:${NC}"
    oc get svc -l app=$APP_NAME
    
    echo -e "\n${BLUE}Routes:${NC}"
    oc get routes -l app=$APP_NAME
    
    echo -e "\n${BLUE}Recent Events:${NC}"
    oc get events --sort-by='.lastTimestamp' | tail -10
}

# Function to view logs
logs() {
    print_step "Viewing application logs"
    
    check_oc_login
    oc project $NAMESPACE >/dev/null 2>&1 || { print_error "Project $NAMESPACE not found"; exit 1; }
    
    oc logs -f dc/$APP_NAME
}

# Function to scale the application
scale() {
    REPLICAS=${1:-2}
    print_step "Scaling application to $REPLICAS replicas"
    
    check_oc_login
    oc project $NAMESPACE >/dev/null 2>&1 || { print_error "Project $NAMESPACE not found"; exit 1; }
    
    oc scale dc/$APP_NAME --replicas=$REPLICAS
    print_success "Scaled to $REPLICAS replicas"
}

# Function to clean up deployment
cleanup() {
    print_step "Cleaning up deployment"
    
    check_oc_login
    oc project $NAMESPACE >/dev/null 2>&1 || { print_error "Project $NAMESPACE not found"; exit 1; }
    
    read -p "Are you sure you want to delete all $APP_NAME resources? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        oc delete all -l app=$APP_NAME
        oc delete configmap -l app=$APP_NAME
        oc delete secret -l app=$APP_NAME 2>/dev/null || true
        print_success "Cleanup completed"
    else
        print_warning "Cleanup cancelled"
    fi
}

# Function to show help
show_help() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  build-local     Build Docker image locally for testing"
    echo "  deploy          Deploy to OpenShift using YAML configuration"
    echo "  deploy-template Deploy to OpenShift using template"
    echo "  status          Check deployment status"
    echo "  logs            View application logs"
    echo "  scale [n]       Scale application to n replicas (default: 2)"
    echo "  cleanup         Remove all deployed resources"
    echo "  generate-data   Generate AQI data files"
    echo "  help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 build-local          # Test build locally"
    echo "  $0 deploy               # Deploy to OpenShift"
    echo "  $0 scale 5              # Scale to 5 replicas"
    echo "  $0 logs                 # View live logs"
}

# Main script logic
case "${1:-help}" in
    build-local)
        build_local
        ;;
    deploy)
        deploy_openshift
        ;;
    deploy-template)
        deploy_from_template
        ;;
    status)
        status
        ;;
    logs)
        logs
        ;;
    scale)
        scale $2
        ;;
    cleanup)
        cleanup
        ;;
    generate-data)
        generate_data
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac