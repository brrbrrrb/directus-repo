FROM directus/directus:latest
USER root
RUN npm install axios pizzip docxtemplater
USER node
