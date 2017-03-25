import json
import os

jsonDict = {}
jsonList = []
counter = 0

with open('questions1_raw.json', 'r') as f:
	question1File = f.read()

with open('questions2_raw.json', 'r') as f:
	question2File = f.read()

parsedJson1 = json.loads(question1File)
parsedJson2 = json.loads(question2File)

with open('questions.json', 'w') as outfile:
	for question in parsedJson1['results']:
		#json.dump(question,outfile, indent = 4, ensure_ascii = False)
		jsonSubDict = {}
		jsonSubDict['category'] = question['category']
		if question['difficulty'] == "easy":
			jsonSubDict['difficulty'] = 0
	 	elif question['difficulty'] == "medium":
	 		jsonSubDict['difficulty'] = 1
	 	else:
	 		jsonSubDict['difficulty'] = 2

		jsonSubDict['question'] = question['question']
		jsonSubDict['correct_answer'] = question['correct_answer']
		jsonSubDict['incorrect_answers'] = question['incorrect_answers']

		jsonList.append(jsonSubDict)


	for question in parsedJson2['normal']:
		#json.dump(question,outfile, indent = 4, ensure_ascii = False)
		jsonSubDict = {}
		jsonSubDict['category'] = question['category']
		if counter % 3 == 0:
			jsonSubDict['difficulty'] = 0
	 	elif counter % 3 == 1:
	 		jsonSubDict['difficulty'] = 1
	 	else:
	 		jsonSubDict['difficulty'] = 2

		jsonSubDict['question'] = question['question']
		jsonSubDict['correct_answer'] = question['answer']
		jsonSubDict['incorrect_answers'] = question['suggestions'][0:3]
		jsonList.append(jsonSubDict)
		counter = counter + 1


	jsonDict["questions"] = jsonList

	json.dump(jsonDict, outfile, indent = 4)



