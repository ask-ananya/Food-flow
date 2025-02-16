best_score = float('-inf')
food_types = ['dairyFree', 'glutenFree', 'halal', 'kosher', 'vegan', 'vegetarian']
best_array = []
perishable_foods = ['dairyFree', 'vegan']

def pairing_alg(rec_df, donor_df, distanceClient):
    for _, donor in donor_df.iterrows():
        best_score = float('-inf')
        don_coords = [donor['donorDetails']['location']['coordinates']['longitude'], donor['donorDetails']['location']['coordinates']['latitude']]

        for _, recipient in rec_df.iterrows():
            # Calculate duration
            rec_coords = [recipient['recipientDetails']['location']['coordinates']['longitude'], recipient['recipientDetails']['location']['coordinates']['latitude']]
            route = distanceClient.directions([don_coords, rec_coords], profile='driving-car')
            duration = route['routes'][0]['summary']['duration'] / 60

            # Base scoring
            current_score = 100
            current_score -= (duration * 10)  # Less penalty for distance, as urgency is removed

            # Capacity impact (Higher priority now)
            current_score += recipient['recipientDetails']['current_capacity']

            # Dietary requirements
            food_match_score = 0
            for food in food_types:
                recipient_need = recipient['recipientDetails']['dietaryRestrictions'].get(food, False)
                donor_has = donor['donorDetails']['food_types'].get(food, False)

                if recipient_need and not donor_has:
                    food_match_score -= 10  # Slightly stronger penalty
                elif recipient_need and donor_has:
                    food_match_score += 30  # Increased reward for a match

            current_score += food_match_score

            # Dairy refrigeration penalties
            if (donor['donorDetails']['food_types'].get('glutenFree', False) or 
                donor['donorDetails']['food_types'].get('halal', False) or 
                donor['donorDetails']['food_types'].get('kosher', False) or 
                donor['donorDetails']['food_types'].get('vegetarian', False)) and not recipient['recipientDetails'].get('hasRefrigeration', False):
                current_score -= 200

            # Operating hours
            def time_to_minutes(t):
                time_parts = t.strip().split(' ')
                hm = time_parts[0].split(':')
                h, m = int(hm[0]), int(hm[1])
                if len(time_parts) > 1 and time_parts[1] == 'PM' and h != 12:
                    h += 12
                return h * 60 + m

            donor_start = donor['donorDetails'].get('operatingHours', {}).get('start', '00:00')
            donor_end = donor['donorDetails'].get('operatingHours', {}).get('end', '23:59')
            recipient_start = recipient['recipientDetails'].get('operatingHours', {}).get('start', '00:00')
            recipient_end = recipient['recipientDetails'].get('operatingHours', {}).get('end', '23:59')

            donor_start_min = time_to_minutes(donor_start)
            donor_end_min = time_to_minutes(donor_end)
            recipient_start_min = time_to_minutes(recipient_start)
            recipient_end_min = time_to_minutes(recipient_end)
            arrival_time = duration  # Arrival time in minutes from now

            # Time window check
            if not (donor_start_min <= arrival_time <= donor_end_min and recipient_start_min <= arrival_time <= recipient_end_min):
                current_score -= 125  # Increased penalty for bad timing

            if current_score > best_score:
                best_score = current_score
                best_pair = [donor, recipient]

        best_array.append(best_pair)

    return best_array
