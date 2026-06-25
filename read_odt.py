import zipfile
import xml.etree.ElementTree as ET

def extract_odt_text(filepath, outpath):
    try:
        with zipfile.ZipFile(filepath, 'r') as z:
            content = z.read('content.xml')
            root = ET.fromstring(content)
            namespaces = {'text': 'urn:oasis:names:tc:opendocument:xmlns:text:1.0'}
            paragraphs = root.findall('.//text:p', namespaces)
            with open(outpath, 'w', encoding='utf-8') as f:
                for p in paragraphs:
                    text = "".join(p.itertext())
                    if text.strip():
                        f.write(text + '\n')
    except Exception as e:
        print(f"Error reading ODT: {e}")

if __name__ == "__main__":
    extract_odt_text(r"c:\Users\furka\OneDrive\Masaüstü\TrustFlow AI\yarisma.odt", r"c:\Users\furka\OneDrive\Masaüstü\TrustFlow AI\yarisma_icerik.md")
