import path from "path";
import YAML from "yamljs";

// Load swagger.yaml file
const swaggerDocument = YAML.load(
  path.join(__dirname, "../../../postman/openapi/skolo_1_0_3.openapi.yaml"),
);

// Swagger UI options
export const swaggerOptions = {
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: false,
    filter: false,
    tryItOutEnabled: false,
  },
  customCss: `
    .swagger-ui .topbar {
      display: flex !important;
      justify-content: flex-end;
      align-items: center;
      background: #fff;
      box-shadow: none;
      min-height: 0;
      padding: 0 20px 0 0;
    }
    .swagger-ui .topbar .download-url-wrapper,
    .swagger-ui .topbar .topbar-wrapper,
    .swagger-ui .topbar .link,
    .swagger-ui .topbar .topbar-logo,
    .swagger-ui .topbar .topbar-title {
      display: none !important;
    }
    .swagger-ui .info,
    .swagger-ui .info .title {
      display: none !important;
    }
    .swagger-ui .scheme-container {
      margin: 30px 0 0 0;
    }
    .swagger-ui .auth-wrapper {
      margin-top: 10px;
    }
  `,
  customSiteTitle: "Skolo API Documentation",
  customfavIcon: "/assets/favicon.ico",
};

export default swaggerDocument;
