FROM public.ecr.aws/lambda/nodejs:20 AS builder

WORKDIR /build

RUN dnf install -y zip && dnf clean all

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .
RUN zip -r /build/function.zip . -x "Dockerfile"

# Export stage — plain image just to hold the file
FROM scratch AS export
COPY --from=builder /build/function.zip /function.zip