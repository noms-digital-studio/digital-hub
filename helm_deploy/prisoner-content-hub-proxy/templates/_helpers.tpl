{{/* vim: set filetype=mustache: */}}
{{/*
Expand the name of the chart.
*/}}
{{- define "prisoner-content-hub.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "prisoner-content-hub.fullname" -}}
{{ if .Values.fullnameOverride -}}
{{ .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else -}}
{{ .Release.Name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "prisoner-content-hub.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "prisoner-content-hub.labels" -}}
chart: {{ include "prisoner-content-hub.chart" . }}
{{ include "prisoner-content-hub.selectorLabels" . }}
heritage: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "prisoner-content-hub.selectorLabels" -}}
app: {{ include "prisoner-content-hub.name" . }}
release: {{ .Release.Name }}
tier: {{ .Values.tier }}
{{- end }}

{{/*
Create external Kubernetes hostname
*/}}
{{- define "prisoner-content-hub.externalHost" -}}
{{- $protocol := "http" }}
{{- if .Values.ingress.tlsEnabled }}
{{- $protocol = "https" }}
{{- end }}
{{- printf "%s://%s" $protocol .Values.ingress.hostName }}
{{- end }}

{{/*
Icecast Config
*/}}
{{- define "prisoner-content-hub.icecastConfig" -}}
{{- $adminUser := (randAlphaNum 128) }}
{{- $adminPassword := (randAlphaNum 128) }}
<icecast>
    <limits>
        <clients>10000</clients>
        <sources>42</sources>
        <threadpool>5</threadpool>
        <queue-size>524288</queue-size>
        <client-timeout>30</client-timeout>
        <header-timeout>15</header-timeout>
        <source-timeout>10</source-timeout>
        <!-- If enabled, this will provide a burst of data when a client 
             first connects, thereby significantly reducing the startup 
             time for listeners that do substantial buffering. However,
             it also significantly increases latency between the source
             client and listening client.  For low-latency setups, you
             might want to disable this. -->
        <burst-on-connect>1</burst-on-connect>
        <!-- same as burst-on-connect, but this allows for being more
             specific on how much to burst. Most people won't need to
             change from the default 64k. Applies to all mountpoints  -->
        <burst-size>65535</burst-size>
    </limits>

    <authentication>
        <admin-user>{{ default $adminUser .Values.nprrelay.adminUser }}</admin-user>
        <admin-password>{{ default $adminPassword .Values.nprrelay.adminPassword }}</admin-password>
    </authentication>

    <!-- This is the hostname other people will use to connect to your server.
    It affects mainly the urls generated by Icecast for playlists and yp
    listings. -->
    <admin>hubteam@digital.justice.gov.uk</admin>
    <location>Berwyn</location>
    <hostname>localhost</hostname>

    <listen-socket>
        <port>8000</port>
    </listen-socket>

    <relay>
        <server>{{ .Values.nprrelay.remoteServer }}</server>
        <port>{{ .Values.nprrelay.remotePort }}</port>
        <mount>{{ .Values.nprrelay.remoteMount }}</mount>
        <local-mount>/npr.ogg</local-mount>
        <on-demand>1</on-demand>
        <relay-shoutcast-metadata>0</relay-shoutcast-metadata>
    </relay>

    <fileserve>1</fileserve>

    <paths>
        <!-- basedir is only used if chroot is enabled -->
        <!-- <basedir>/usr/share/icecast</basedir> -->

        <!-- Note that if <chroot> is turned on below, these paths must both
             be relative to the new root, not the original root -->
        <logdir>/var/log/icecast</logdir>
        <webroot>/usr/share/icecast/web</webroot>
        <adminroot>/usr/share/icecast/admin</adminroot>
        <!-- <pidfile>/usr/share/icecast2/icecast.pid</pidfile> -->

        <!-- Aliases: treat requests for 'source' path as being for 'dest' path
             May be made specific to a port or bound address using the "port"
             and "bind-address" attributes.
          -->
        <!--
        <alias source="/foo" dest="/bar"/>
          -->
        <!-- Aliases: can also be used for simple redirections as well,
             this example will redirect all requests for http://server:port/ to
             the status page
          -->
        <alias source="/" dest="/status.xsl"/>
    </paths>

    <logging>
        <accesslog>-</accesslog>
        <errorlog>-</errorlog>
        <loglevel>3</loglevel>        <!-- 4 Debug, 3 Info, 2 Warn, 1 Error -->
        <logsize>10000</logsize>        <!-- Max size of a logfile -->
        <!-- If logarchive is enabled (1), then when logsize is reached
             the logfile will be moved to [error|access|playlist].log.DATESTAMP,
             otherwise it will be moved to [error|access|playlist].log.old.
             Default is non-archive mode (i.e. overwrite)
        -->
        <logarchive>1</logarchive>
    </logging>

    <security>
        <chroot>0</chroot>
    </security>
</icecast>
{{- end }}
