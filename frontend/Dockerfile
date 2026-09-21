# Dev image. Source is bind-mounted and Next reloads on change; node_modules
# lives in the image so the linux/musl native binaries are not overwritten by
# the host's copy.
FROM node:26-alpine

WORKDIR /app
# .next is an anonymous volume in compose; it has to exist in the image and be
# owned by node, or docker creates the volume root-owned and next dev cannot write.
RUN mkdir -p /app/.next && chown -R node:node /app
USER node

COPY --chown=node:node package.json package-lock.json ./
RUN npm ci

COPY --chown=node:node . .

EXPOSE 3000
CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0"]
