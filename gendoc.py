#! /usr/bin/python
import os

os.system("smartDoc")
os.system("rm -rf doc/files/")

ROOT="doc/classes/"
for fn in os.listdir(ROOT):
	if fn.endswith(".html"):
		a, cmt=[], False
		with open(ROOT+fn) as f:
			for l in f.readlines():
				if l.strip(" \t\n\r") == "":
					continue 
				if cmt:
					if "</div>" in l:
						a.append("\n")
						cmt = False
					else: 
						continue
				elif '<div class="meta">' in l:
					cmt=True
				else:
					a.append(l)
		b, cmt = [], False
		for l in a:
			if cmt:
				if '</div>' in l:
					cmt = False
				else:
					continue
			elif '<div class="foundat">' in l:
				cmt = True
			else:
				b.append(l)		
		with open(ROOT+fn, "w") as f:
			for l in b:
				f.write(l)

