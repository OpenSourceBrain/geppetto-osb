FROM java:7
MAINTAINER Stephen Larson "stephen@metacell.us"

RUN apt-get update && apt-get install -y sudo

RUN useradd -ms /bin/bash developer

RUN mkdir -p /home/developer && mkdir -p /etc/sudoers.d \
    echo "developer:x:1000:1000:Developer,,,:/home/developer:/bin/bash" >> /etc/passwd && \
    echo "developer:x:1000:" >> /etc/group && \
    echo "developer ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/developer && \
    chmod 0440 /etc/sudoers.d/developer && \
    chown developer:developer -R /home/developer && \
    chown root:root /usr/bin/sudo && chmod 4755 /usr/bin/sudo

USER developer
ENV HOME /home/developer
WORKDIR /home/developer

#VIRGO INSTALL
USER root
RUN apt-get update && apt-get install -y curl bsdtar
RUN wget http://www-eu.apache.org/dist/maven/maven-3/3.5.0/binaries/apache-maven-3.5.0-bin.tar.gz && tar -zxf apache-maven-3.5.0-bin.tar.gz && mv apache-maven-3.5.0 /tmp && ln -s /tmp/apache-maven-3.5.0/bin/mvn /usr/local/bin/mvn && chmod 777 /usr/local/bin/mvn
USER developer
RUN mkdir -p /home/developer/virgo
RUN curl -L 'http://www.eclipse.org/downloads/download.php?file=/virgo/release/VP/3.6.4.RELEASE/virgo-tomcat-server-3.6.4.RELEASE.zip&mirror_id=580&r=1' | bsdtar --strip-components 1 -C /home/developer/virgo -xzf -
RUN chmod u+x /home/developer/virgo/bin/*.sh
ENV SERVER_HOME /home/developer/virgo
#VOLUME /home/developer/virgo
#END VIRGO INSTALL

#GET GEPPETTO SOURCES
USER root
RUN mkdir -p workspace && cd workspace && git clone https://github.com/openworm/org.geppetto
RUN chmod -R 777 workspace
USER developer
#SETUP THE SOURCE CODE, CHECKOUT APPROPRIATE BRANCHES
RUN cd workspace/org.geppetto/utilities/source_setup && yes n | python setup.py && python gitall.py pull && python gitall.py reset && python gitall.py checkout development && python gitall.py checkout view-state && python gitall.py checkout 3dcanvasextraction

#PUT GEPPETTO-OSB IN THE FRONTEND
RUN cd workspace/org.geppetto.frontend/src/main/webapp/extensions && git clone https://github.com/OpenSourceBrain/geppetto-osb.git && cd geppetto-osb && git checkout 3dcanvasextraction

#FORCE EXTENSIONS CONFIGURATION
ADD extensionsConfiguration.json workspace/org.geppetto.frontend/src/main/webapp/extensions/
RUN sudo chmod -R 777 workspace

#BUILD
RUN cd workspace/org.geppetto && mvn install
#END GET GEPPETTO SOURCES

RUN mkdir -p geppetto/

#RUN sudo chmod +x geppetto/*.sh

RUN cd /home/developer/workspace/org.geppetto/utilities/source_setup && python update_server.py

CMD /home/developer/virgo/bin/startup.sh
