FROM mcr.microsoft.com/playwright:v1.64.1-noble
COPY claude omp /usr/local/bin/
COPY workspace /work/tests-project
RUN cd /work/tests-project && npm ci --no-audit --no-fund \
 && mkdir -p /home/agent /work/app && chown -R 1000:1000 /work /home/agent
ENV HOME=/home/agent
USER 1000:1000
WORKDIR /work/tests-project
