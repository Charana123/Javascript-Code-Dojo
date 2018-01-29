BINDIR ?= $(CURDIR)/bin
VNUJAR := $(BINDIR)/vnu.jar
VNUURL := https://github.com/validator/validator/releases/download/17.11.1/vnu.jar_17.11.1.zip

help:
	# all     - download bins and run verify
	# bin     - donwload binary files
	# verify  - verify html pages

.PHONY: all verify bin

all: bin verify

bin:
	mkdir -p $(BINDIR)
	curl -sL -o $(BINDIR)/vnu.jar.zip $(VNUURL)
	unzip $(BINDIR)/vnu.jar.zip -d $(BINDIR)
	mv $(BINDIR)/dist/vnu.jar $(VNUJAR)
	rm -rf $(BINDIR)/dist
	rm -rf $(BINDIR)/vnu.jar.zip

verify: $(VNUJAR)
	find . -name '*.html' -exec java -jar $(VNUJAR) {} \;
