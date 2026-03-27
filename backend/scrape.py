import csv
import re
import time
from typing import Dict, List, Optional, Tuple

import requests
from bs4 import BeautifulSoup


base_url = 'https://indiarailinfo.com'
start_url = f'{base_url}/trains/vande-bharat-express/vandebharat'


def fetch(url: str) -> Optional[str]:
	"""Fetch a URL with basic headers and simple retry."""
	headers = {
		'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0 Safari/537.36',
		'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
		'Accept-Language': 'en-US,en;q=0.9'
	}
	for attempt in range(3):
		try:
			resp = requests.get(url, headers=headers, timeout=30)
			resp.raise_for_status()
			return resp.text
		except requests.exceptions.RequestException:
			if attempt == 2:
				return None
			time.sleep(1 + attempt)
	return None


def normalize_whitespace(text: str) -> str:
	return re.sub(r'\s+', ' ', text).strip()


def parse_card_text(text: str) -> Dict[str, Optional[str]]:
	"""Heuristic extraction of fields from a single train card's text."""
	normal = normalize_whitespace(text)
	# Train numbers (there are typically a pair, up/down)
	train_numbers = re.findall(r'\b\d{5}\b', normal)
	# Distance and speed
	distance_km_match = re.search(r'(\d+)\s*km\b', normal, re.IGNORECASE)
	speed_kmph_match = re.search(r'(\d+)\s*km/hr\b', normal, re.IGNORECASE)
	# Duration like 6h 30m
	duration_match = re.search(r'(\d+h\s*\d+m)', normal, re.IGNORECASE)
	# Times
	times = re.findall(r'\b\d{1,2}:\d{2}\b', normal)
	dep_time = times[0] if len(times) >= 1 else None
	arr_time = times[1] if len(times) >= 2 else None
	# Attempt to capture name line that ends with "Vande Bharat Express"
	name_match = re.search(r'([A-Za-z ()\-]+?Vande Bharat Express)', normal)
	train_name = name_match.group(1).strip() if name_match and "Vande Bharat Express" in name_match.group(1) else None
	# Try to capture station codes around times (uppercase tokens nearby)
	station_codes = re.findall(r'\b[A-Z]{2,5}\b', normal)
	src_code = None
	dst_code = None
	if len(station_codes) >= 2:
		src_code = station_codes[0]
		dst_code = station_codes[1]
		if src_code == dst_code:
			dst_code = station_codes[2] if len(station_codes) > 2 else None

	# Zone appears as two/three letters like CR, WR, SR, etc. Use a conservative pick.
	zone_match = re.search(r'\b(WR|WCR|CR|ER|ECR|ECoR|SER|SR|SWR|NWR|NR|NFR|SCR|SECR)\b', normal)
	zone = zone_match.group(1) if zone_match else None
	# Class indicators like CC, Ex, 2S etc; capture common ones
	classes = ', '.join(sorted(set(re.findall(r'\b(?:CC|EC|Ex|2S|3A|2A|1A|SL|EV)\b', normal)))) or None
	# Type: almost always "VB" for Vande Bharat on this page
	type_match = re.search(r'\bVande Bharat\b|\bVB\b', normal)
	train_type = 'Vande Bharat' if type_match else None
	# Halts count if present as e.g., "6" between fields; heuristic: number followed by 'h' is duration; we want standalone number before 'km'
	halts_match = re.search(r'\b(\d{1,2})\b\s*(?:\|\s*)?Distance', normal)
	# Days of week: presence-only; page text includes S M T W T F S in a row.
	def day_present(letter: str) -> Optional[str]:
		return 'Y' if re.search(rf'\b{letter}\b', normal) else 'N'
	return {
		'raw': normal,
		'train_numbers': ', '.join(train_numbers) if train_numbers else None,
		'name': train_name,
		'zone': zone,
		'source': src_code,
		'departure_time': dep_time,
		'destination': dst_code,
		'arrival_time': arr_time,
		'duration': duration_match.group(1) if duration_match else None,
		'distance_km': distance_km_match.group(1) if distance_km_match else None,
		'speed_kmph': speed_kmph_match.group(1) if speed_kmph_match else None,
		'classes': classes,
		'type': train_type,
		'halts': halts_match.group(1) if halts_match else None,
		'sun': day_present('S'),
		'mon': day_present('M'),
		'tue': day_present('T'),
		'wed': day_present('W'),
		'thu': day_present('T'),
		'fri': day_present('F'),
		'sat': day_present('S')
	}


def parse_list_page(html: str) -> Tuple[List[Dict[str, Optional[str]]], Optional[str]]:
	"""Parse one listing page and return extracted items and the next page URL if any."""
	soup = BeautifulSoup(html, 'html.parser')
	items: List[Dict[str, Optional[str]]] = []
	# Cards are often inside div.newbg; fall back to broad containers if needed
	cards = soup.find_all('div')
	if not cards:
		# fallback: try generic containers that hold each train block
		cards = soup.find_all('div', class_='bgwhite') or soup.find_all('div', class_='p-10')
	for card in cards:
		text = card.get_text(separator=' ', strip=True)
		if not text:
			continue
		item = parse_card_text(text)
		# Only keep if we identify at least a train number or a name
		if item.get('train_numbers') or item.get('name'):
			items.append(item)
	# Find next page link by text
	next_link = None
	for a in soup.find_all('a'):
		label = (a.get_text() or '').strip().lower()
		if 'next page' in label:
			href = a.get('href')
			if href and not href.startswith('javascript:'):
				next_link = href
				break
	if next_link and not next_link.startswith('http'):
		next_link = f"{base_url}{next_link}"
	return items, next_link


def scrape_all_pages(starting_url: str) -> List[Dict[str, Optional[str]]]:
	seen_urls = set()
	url = starting_url
	all_items: List[Dict[str, Optional[str]]] = []
	while url and url not in seen_urls:
		seen_urls.add(url)
		html = fetch(url)
		if not html:
			break
		items, next_url = parse_list_page(html)
		all_items.extend(items)
		url = next_url
		# be polite
		time.sleep(0.5)
	return all_items


def write_csv(path: str, rows: List[Dict[str, Optional[str]]]) -> None:
	fieldnames = [
		'No.', 'Name', 'Type', 'Zone', 'From', 'Dep', 'To', 'Arr', 'Duration',
		'Halts', 'Distance', 'Avg Speed', 'Return', 'Classes',
		'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'
	]
	with open(path, 'w', newline='', encoding='utf-8') as f:
		writer = csv.DictWriter(f, fieldnames=fieldnames)
		writer.writeheader()
		for row in rows:
			train_numbers = (row.get('train_numbers') or '').split(',')
			primary_no = train_numbers[0].strip() if train_numbers else ''
			if not primary_no:
				continue
			return_no = train_numbers[1].strip() if len(train_numbers) > 1 else ''
			distance_val = row.get('distance_km') or ''
			distance_out = f"{distance_val} km" if distance_val else ''
			speed_val = row.get('speed_kmph') or ''
			speed_out = f"{speed_val} km/hr" if speed_val else ''
			writer.writerow({
				'No.': primary_no,
				'Name': row.get('name') or '',
				'Type': 'VB',
				'Zone': row.get('zone') or '',
				'From': row.get('source') or '',
				'Dep': row.get('departure_time') or '',
				'To': row.get('destination') or '',
				'Arr': row.get('arrival_time') or '',
				'Duration': row.get('duration') or '',
				'Halts': row.get('halts') or '',
				'Distance': distance_out,
				'Avg Speed': speed_out,
				'Return': return_no,
				'Classes': row.get('classes') or '',
				'Sun': row.get('sun') or '',
				'Mon': row.get('mon') or '',
				'Tue': row.get('tue') or '',
				'Wed': row.get('wed') or '',
				'Thu': row.get('thu') or '',
				'Fri': row.get('fri') or '',
				'Sat': row.get('sat') or ''
			})


def write_excel(path: str, rows: List[Dict[str, Optional[str]]]) -> None:
	try:
		import pandas as pd
		# Rebuild the same structure as CSV for consistent column order
		csv_rows: List[Dict[str, Optional[str]]] = []
		for row in rows:
			train_numbers = (row.get('train_numbers') or '').split(',')
			primary_no = train_numbers[0].strip() if train_numbers else ''
			return_no = train_numbers[1].strip() if len(train_numbers) > 1 else ''
			distance_val = row.get('distance_km') or ''
			distance_out = f"{distance_val} km" if distance_val else ''
			speed_val = row.get('speed_kmph') or ''
			speed_out = f"{speed_val} km/hr" if speed_val else ''
			csv_rows.append({
				'No.': primary_no,
				'Name': row.get('name') or '',
				'Type': 'VB',
				'Zone': row.get('zone') or '',
				'From': row.get('source') or '',
				'Dep': row.get('departure_time') or '',
				'To': row.get('destination') or '',
				'Arr': row.get('arrival_time') or '',
				'Duration': row.get('duration') or '',
				'Halts': row.get('halts') or '',
				'Distance': distance_out,
				'Avg Speed': speed_out,
				'Return': return_no,
				'Classes': row.get('classes') or '',
				'Sun': row.get('sun') or '',
				'Mon': row.get('mon') or '',
				'Tue': row.get('tue') or '',
				'Wed': row.get('wed') or '',
				'Thu': row.get('thu') or '',
				'Fri': row.get('fri') or '',
				'Sat': row.get('sat') or ''
			})
		df = pd.DataFrame(csv_rows)
		cols = ['No.', 'Name', 'Type', 'Zone', 'From', 'Dep', 'To', 'Arr', 'Duration',
		        'Halts', 'Distance', 'Avg Speed', 'Return', 'Classes',
		        'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
		df = df.reindex(columns=cols)
		# Use openpyxl engine if available
		try:
			with pd.ExcelWriter(path, engine='openpyxl') as writer:
				df.to_excel(writer, index=False, sheet_name='VandeBharat')
		except Exception:
			# fallback to default writer
			df.to_excel(path, index=False, sheet_name='VandeBharat')
	except ImportError:
		# Excel export skipped if pandas missing
		pass




def main() -> None:
	print('Scraping Vande Bharat listings...')
	rows = scrape_all_pages(start_url)
	# Deduplicate with robust keys; fall back to raw snippet if needed
	seen_keys = set()
	unique_rows: List[Dict[str, Optional[str]]] = []
	for r in rows:
		train_no = r.get('train_numbers') or ''
		name = r.get('name') or ''
		src = r.get('source') or ''
		dst = r.get('destination') or ''
		key = f"{train_no}|{name}|{src}|{dst}"
		if key in seen_keys:
			continue
		seen_keys.add(key)
		unique_rows.append(r)
	print(f'Found {len(unique_rows)} trains.')
	write_csv('vande_bharat_all.csv', unique_rows)



if __name__ == '__main__':
	main()
