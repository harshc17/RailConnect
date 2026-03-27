
'''
Generates train data connecting every railway station to each other.
'''

import random
import math
from datetime import datetime, timedelta
import json

STATIONS = {
    'NDLS': {'name': 'NEW DELHI', 'zone': 'NR'},
    'HWH': {'name': 'HOWRAH', 'zone': 'ER'},
    'MAS': {'name': 'MGR CHENNAI CENTRAL', 'zone': 'SR'},
    'SC': {'name': 'SECUNDERABAD', 'zone': 'SCR'},
    'NZM': {'name': 'HAZRAT NIZAMUDDIN JN', 'zone': 'NR'},
    'LTT': {'name': 'LOKMANYA TILAK TERMINUS', 'zone': 'CR'},
    'ADI': {'name': 'AHMEDABAD', 'zone': 'WR'},
    'CSMT': {'name': 'MUMBAI CSMT', 'zone': 'CR'},
    'PUNE': {'name': 'PUNE', 'zone': 'CR'},
    'ANVT': {'name': 'ANAND VIHAR TERMINAL', 'zone': 'NR'},
    'ST': {'name': 'SURAT', 'zone': 'WR'},
    'SBC': {'name': 'KSR BENGALURU', 'zone': 'SWR'},
    'PNBE': {'name': 'PATNA JN', 'zone': 'ECR'},
    'JP': {'name': 'JAIPUR', 'zone': 'NWR'},
    'DLI': {'name': 'DELHI JN', 'zone': 'NR'},
    'MS': {'name': 'CHENNAI EGMORE', 'zone': 'SR'},
    'GKP': {'name': 'GORAKHPUR JN', 'zone': 'NER'},
    'VSKP': {'name': 'VISAKHAPATNAM', 'zone': 'ECOR'},
    'BSB': {'name': 'VARANASI', 'zone': 'NR'},
    'NGP': {'name': 'NAGPUR', 'zone': 'CR'},
    'BZA': {'name': 'VIJAYAWADA', 'zone': 'SCR'},
    'KYN': {'name': 'KALYAN', 'zone': 'CR'},
    'MMCT': {'name': 'MUMBAI CENTRAL', 'zone': 'WR'},
    'BBS': {'name': 'BHUBANESWAR', 'zone': 'ECOR'},
    'SDAH': {'name': 'SEALDAH', 'zone': 'ER'},
    'JAT': {'name': 'JAMMU TAWI', 'zone': 'NR'},
    'BDTS': {'name': 'BANDRA TERMINUS', 'zone': 'WR'},
    'TPTY': {'name': 'TIRUPATI', 'zone': 'SCR'},
    'SMVB': {'name': 'SMVT BENGLURE', 'zone': 'SWR'},
    'BPL': {'name': 'BHOPAL JN', 'zone': 'WCR'},
    'LKO': {'name': 'LUCKNOW', 'zone': 'NR'},
    'CNB': {'name': 'KANPUR CENTRAL', 'zone': 'NCR'},
    'PRYJ': {'name': 'PRAYAGRAJ JN', 'zone': 'NCR'},
    'YPR': {'name': 'YESVANTPUR', 'zone': 'SWR'},
    'INDB': {'name': 'INDORE', 'zone': 'WR'},
    'BRC': {'name': 'VADODARA', 'zone': 'WR'},
    'NJP': {'name': 'NEW JALPAIGURI', 'zone': 'NFR'},
    'GHY': {'name': 'GUWAHATI', 'zone': 'NFR'},
    'CBE': {'name': 'COIMBATORE JN', 'zone': 'SR'},
    'JBP': {'name': 'JABALPUR', 'zone': 'WCR'},
    'AII': {'name': 'AJMER', 'zone': 'NWR'},
    'R': {'name': 'RAIPUR', 'zone': 'SECR'},
    'JU': {'name': 'JODHPUR JN', 'zone': 'NWR'},
    'LJN': {'name': 'LUCKNOW JN', 'zone': 'NER'},
    'HW': {'name': 'HARIDWAR JN', 'zone': 'NR'},
    'KCG': {'name': 'KACHEGUDA', 'zone': 'SCR'},
    'ASR': {'name': 'AMRITSAR JN', 'zone': 'NR'},
    'SHM': {'name': 'SHALIMAR', 'zone': 'SER'},
    'VGLJ': {'name': 'V LAXMIBI JHANSI JN', 'zone': 'NCR'},
    'GWL': {'name': 'GWALIOR JN', 'zone': 'NCR'},
    'KOTA': {'name': 'KOTA JN', 'zone': 'WCR'},
    'TVC': {'name': 'TIRUVANANTHAPURAM CENTRAL', 'zone': 'SR'},
    'TNA': {'name': 'THANE', 'zone': 'CR'},
    'DNR': {'name': 'DANAPUR', 'zone': 'ECR'},
    'MFP': {'name': 'MUZAFFARPUR JN', 'zone': 'ECR'},
    'RNC': {'name': 'RANCHI', 'zone': 'SER'},
    'AGC': {'name': 'AGRA CANTT', 'zone': 'NCR'},
    'CDG': {'name': 'CHANDIGARH', 'zone': 'NR'},
    'DDU': {'name': 'PTDEEN DAYAL UPADHYAYA JN', 'zone': 'ECR'},
    'UJN': {'name': 'UJJAIN', 'zone': 'WR'},
    'PURI': {'name': 'PURI', 'zone': 'ECOR'},
    'TBM': {'name': 'TAMBARAM', 'zone': 'SR'},
    'ERS': {'name': 'ERNAKULAM JN', 'zone': 'SR'},
    'BSBS': {'name': 'BANARAS', 'zone': 'NER'},
    'GAYA': {'name': 'GAYA', 'zone': 'ECR'},
    'LDH': {'name': 'LUDHIANA JN', 'zone': 'NR'},
    'MTJ': {'name': 'MATHURA JN', 'zone': 'NCR'},
    'DR': {'name': 'DADAR', 'zone': 'CR'},
    'MDU': {'name': 'MADURAI JN', 'zone': 'SR'},
    'DEE': {'name': 'DELHI SARAI ROHILLA', 'zone': 'NR'},
    'HYB': {'name': 'HYDERABAD', 'zone': 'SCR'},
    'UMB': {'name': 'AMBALA CANTT JN', 'zone': 'NR'},
    'SVDK': {'name': 'SHRI MATA VAISHNO DEVI KATRA', 'zone': 'NR'},
    'DHN': {'name': 'DHANBAD JN', 'zone': 'ECR'},
    'KOAA': {'name': 'KOLKATA', 'zone': 'ER'},
    'TATA': {'name': 'TATANAGAR', 'zone': 'SER'},
    'NK': {'name': 'NASIK ROAD', 'zone': 'CR'},
    'CLT': {'name': 'KOZHIKKODE', 'zone': 'SR'},
    'PNVL': {'name': 'PANVEL', 'zone': 'CR'},
    'RKMP': {'name': 'RANI KAMALAPATI', 'zone': 'WCR'},
    'NED': {'name': 'HAZUR SAHIB NANDED', 'zone': 'SCR'},
    'KGP': {'name': 'KHARAGPUR', 'zone': 'SER'},
    'RJT': {'name': 'RAJKOT', 'zone': 'WR'},
    'GZB': {'name': 'GHAZIABAD JN', 'zone': 'NR'},
    'DBG': {'name': 'DARBHANGA', 'zone': 'ECR'},
    'ASN': {'name': 'ASANSOL', 'zone': 'ER'},
    'BSP': {'name': 'BILASPUR', 'zone': 'SECR'},
    'TPJ': {'name': 'TIRUCHCHIRAPPALLI JN', 'zone': 'SR'},
    'TCR': {'name': 'THRISUR', 'zone': 'SR'},
    'KIR': {'name': 'KATIHAR', 'zone': 'NFR'},
    'CPR': {'name': 'CHHAPRA JN', 'zone': 'NER'},
    'BGP': {'name': 'BHAGALPUR', 'zone': 'ER'}
}

TRAIN_TYPES = ['Express', 'Superfast', 'Rajdhani', 'Shatabdi', 'Duronto', 'Mail']
CLASSES = {
    '1A': {'name': 'AC First Class', 'price_per_km': 4},
    '2A': {'name': 'AC 2 Tier', 'price_per_km': 2.5},
    '3A': {'name': 'AC 3 Tier', 'price_per_km': 1.8},
    'SL': {'name': 'Sleeper', 'price_per_km': 1},
    'CC': {'name': 'Chair Car', 'price_per_km': 1.5},
    'EC': {'name': 'Executive Class', 'price_per_km': 3}
}
DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

def haversine(lat1, lon1, lat2, lon2):
    R = 6371  # Radius of Earth in kilometers
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat / 2) * math.sin(dLat / 2) + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dLon / 2) * math.sin(dLon / 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance = R * c
    return distance

def generate_trains():
    # Generate random coordinates for stations
    for code in STATIONS:
        STATIONS[code]['lat'] = random.uniform(6, 35)
        STATIONS[code]['lon'] = random.uniform(68, 97)

    trains_sql = []
    train_classes_sql = []
    train_id = 101  # Start from a higher number to avoid conflicts
    train_number_start = 20000

    station_codes = list(STATIONS.keys())

    for i in range(len(station_codes)):
        for j in range(len(station_codes)):
            if i == j:
                continue

            from_station_code = station_codes[i]
            to_station_code = station_codes[j]

            from_station = STATIONS[from_station_code]
            to_station = STATIONS[to_station_code]

            distance = int(haversine(from_station['lat'], from_station['lon'], to_station['lat'], to_station['lon']))
            if distance < 50:
                continue

            train_type = random.choice(TRAIN_TYPES)
            avg_speed = random.randint(50, 100)
            duration_hours = distance / avg_speed
            duration_str = f'{int(duration_hours):02d}:{int((duration_hours * 60) % 60):02d}'

            departure_time = f'{random.randint(0, 23):02d}:{random.randint(0, 59):02d}:00'
            departure_datetime = datetime.strptime(departure_time, '%H:%M:%S')
            arrival_datetime = departure_datetime + timedelta(hours=duration_hours)
            arrival_time = arrival_datetime.strftime('%H:%M:%S')

            running_days = sorted(random.sample(DAYS, random.randint(1, 7)))

            train_name = f'{from_station["name"].split(" ")[0]} - {to_station["name"].split(" ")[0]} {train_type}'
            train_number = str(train_number_start)
            train_number_start += 1

            sql = "INSERT INTO trains (id, number, name, from_station, to_station, departure_time, arrival_time, duration, days, type, zone, distance, status) VALUES ({id}, '{number}', '{name}', '{from_station}', '{to_station}', '{departure_time}', '{arrival_time}', '{duration}', '{days}', '{type}', '{zone}', {distance}, 'active');"
            trains_sql.append(sql.format(
                id=train_id,
                number=train_number,
                name=train_name.replace("'", "''"),
                from_station=from_station_code,
                to_station=to_station_code,
                departure_time=departure_time,
                arrival_time=arrival_time,
                duration=duration_str,
                days=json.dumps(running_days),
                type=train_type,
                zone=from_station['zone'],
                distance=distance
            ))

            train_classes = random.sample(list(CLASSES.keys()), random.randint(2, 5))
            for class_code in train_classes:
                base_price = round(distance * CLASSES[class_code]['price_per_km'], 2)
                total_seats = random.randint(20, 100)
                available_seats = random.randint(10, total_seats)
                train_classes_sql.append(
                    f"INSERT INTO train_classes (train_id, class_code, class_name, base_price, total_seats, available_seats) VALUES "
                    f"({train_id}, '{class_code}', '{CLASSES[class_code]['name']}', {base_price}, {total_seats}, {available_seats});"
                )

            train_id += 1

    with open('d:/Projects/RailConnect/database/new_trains.sql', 'w') as f:
        f.write("-- Generated Train Data\n")
        f.write("\n".join(trains_sql))
        f.write("\n\n-- Generated Train Class Data\n")
        f.write("\n".join(train_classes_sql))

if __name__ == '__main__':
    generate_trains()
    print("Successfully generated new_trains.sql")
