FROM debian:buster


ENV TARGET_SG sg-00000000000000000
ENV TZ Asia/Tokyo
RUN apt-get update

# apache
RUN apt-get install -y apache2 libapache2-mod-auth-openidc
RUN rm /etc/apache2/conf-enabled/other-vhosts-access-log.conf
RUN mkdir /var/run/apache2
RUN a2enmod proxy proxy_http
COPY apache2.conf /etc/apache2/apache2.conf
COPY auth_openidc.conf /etc/apache2/mods-available/auth_openidc.conf

# nodejs
RUN apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_16.x | bash -
RUN apt-get install -y nodejs
COPY app /app
WORKDIR /app
RUN npm ci --only=prod

# cron
RUN apt-get install -y cron
COPY crontab /etc/crontab
RUN chmod 644 /etc/crontab

# cmd
COPY run.sh /run.sh
RUN chmod +x /run.sh
CMD /run.sh
