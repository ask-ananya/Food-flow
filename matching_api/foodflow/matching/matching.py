best_score = float('-inf')
food_types = ['dairyFree', 'glutenFree', 'halal', 'kosher', 'vegan', 'vegetarian']
best_array = []
perishable_foods = ['dairyFree', 'vegan']
dairy_threshold = 30
produce_threshold = 45
no_refrigeration_penalty = 30  # Slightly higher penalty

def matching_alg(rec_df, donor_df, distanceClient):
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
            current_score -= (duration * 7)  # Less penalty for distance, as urgency is removed

            # Capacity impact (Higher priority now)
            current_score += (recipient['recipientDetails']['current_capacity'] * 2)

            # Dietary requirements
            food_match_score = 0
            for food in food_types:
                recipient_need = recipient['recipientDetails']['dietaryRestrictions'].get(food, False)
                donor_has = donor['donorDetails']['food_types'].get(food, False)

                if recipient_need and not donor_has:
                    food_match_score -= 10  # Slightly stronger penalty
                elif recipient_need and donor_has:
                    food_match_score += 15  # Increased reward for a match

            current_score += food_match_score

            # Perishability penalties
            if recipient['recipientDetails']['dietaryRestrictions'].get('dairyFree', False) and duration > dairy_threshold:
                current_score -= 20
            if recipient['recipientDetails']['dietaryRestrictions'].get('vegan', False) and duration > produce_threshold:
                current_score -= 10

            # Refrigeration
            donor_refrigeration = donor['donorDetails'].get('refrigeration', False)
            if (recipient['recipientDetails']['dietaryRestrictions'].get('dairyFree', False) or recipient['recipientDetails']['dietaryRestrictions'].get('vegan', False)) and not donor_refrigeration and duration > 20:
                current_score -= no_refrigeration_penalty

            # Quantity matching (Now more important)
            needed_qty = recipient['recipientDetails'].get('neededQuantity', 0)
            donor_qty = donor['donorDetails'].get('quantityAvailable', 0)
            if needed_qty > 0:
                qty_ratio = min(donor_qty / needed_qty, 1)
                current_score += qty_ratio * 30  # Increased weight on quantity match

            # Operating hours
            def time_to_minutes(t):
                h, m = t.split(':')
                m, k = m.split(' ')[0]
                return int(h) * 60 + int(m) + (720 if "PM" in k and int(h) != 12 else 0)

            donor_start = donor['donorDetails'].get('operatingHours', {}).get('start', '00:00')
            donor_end = donor['donorDetails'].get('operatingHours', {}).get('end', '23:59')
            recipient_start = recipient['recipientDetails'].get('operatingHours', {}).get('start', '00:00')
            recipient_end = recipient['recipientDetails'].get('operatingHours', {}).get('end', '23:59')

            donor_start_min = time_to_minutes(donor_start)
            donor_end_min = time_to_minutes(donor_end)
            recipient_start_min = time_to_minutes(recipient_start)
            recipient_end_min = time_to_minutes(recipient_end)
            arrival_time = duration

            # Time window check
            if not (donor_start_min <= arrival_time <= donor_end_min and recipient_start_min <= arrival_time <= recipient_end_min):
                current_score -= 25  # Increased penalty for bad timing

            if current_score > best_score:
                best_score = current_score
                best_pair = [donor, recipient]

        best_array.append(best_pair)

    return best_array