/**
 * Predefined tasks required to complete the 48 Continental USA website project.
 * These tasks can be used to automate issue creation and workflow management.
 */

export const websiteProjectTasks = [
  {
    owner: "48continental",
    repo: "public-site",
    title: "Fix map rendering issues on EnhancedVehicleMap component",
    body: "Investigate and resolve map rendering glitches reported in EnhancedVehicleMap.jsx. Ensure smooth zoom and pan functionality.",
    labels: ["bug", "map", "high-priority"],
    assignees: ["frontend-dev"],
  },
  {
    owner: "48continental",
    repo: "public-site",
    title: "Integrate weather data overlay on vehicle map",
    body: "Add weather data integration along the route on the vehicle map using OpenWeatherMap API. Display current and forecasted weather conditions.",
    labels: ["feature", "map", "weather"],
    assignees: ["frontend-dev", "backend-dev"],
  },
  {
    owner: "48continental",
    repo: "public-site",
    title: "Implement historical path tracking (breadcrumb trail)",
    body: "Develop functionality to show the historical path of the vehicle on the map as a breadcrumb trail with timestamps.",
    labels: ["feature", "map", "tracking"],
    assignees: ["frontend-dev"],
  },
  {
    owner: "48continental",
    repo: "public-site",
    title: "Add charging station directory overlay",
    body: "Overlay charging station locations on the map with interactive markers and details.",
    labels: ["feature", "map", "charging"],
    assignees: ["frontend-dev"],
  },
  {
    owner: "48continental",
    repo: "public-site",
    title: "Develop trip statistics dashboard",
    body: "Create a dashboard component to display trip statistics such as distance traveled, average speed, and charging times.",
    labels: ["feature", "dashboard"],
    assignees: ["frontend-dev"],
  },
  {
    owner: "48continental",
    repo: "public-site",
    title: "Optimize Tessie API integration for production",
    body: "Refactor and optimize the Tessie API integration for better performance and reliability in production.",
    labels: ["backend", "optimization"],
    assignees: ["backend-dev"],
  },
  {
    owner: "48continental",
    repo: "public-site",
    title: "Implement secure authentication flow for vehicle control features",
    body: "Add secure authentication and authorization for vehicle control features to prevent unauthorized access.",
    labels: ["security", "backend"],
    assignees: ["backend-dev", "security-team"],
  },
  {
    owner: "48continental",
    repo: "public-site",
    title: "Performance optimization for mobile devices",
    body: "Improve performance and responsiveness of the website on mobile devices.",
    labels: ["performance", "mobile"],
    assignees: ["frontend-dev"],
  },
  {
    owner: "48continental",
    repo: "public-site",
    title: "Set up automated testing infrastructure",
    body: "Implement automated unit, integration, and end-to-end tests for the website components.",
    labels: ["testing", "automation"],
    assignees: ["qa-team"],
  },
  {
    owner: "48continental",
    repo: "public-site",
    title: "Integrate CI/CD pipeline for website deployment",
    body: "Set up continuous integration and deployment pipeline for automated website builds and deployments.",
    labels: ["devops", "ci/cd"],
    assignees: ["devops-team"],
  },
];
