---
trigger: always_on
---

* The main method in main.py is the entry point to showcase functionality.
* Do not generate code in the main method. Instead generate distinct functionality in a new file (eg. feature_x.py)
* Then, generate example code to show the new functionality in a new method in main.py (eg. example_feature_x) and simply call that method from the main method.
* Add test for new function
* Run make test-(backend/frontend) to verify the result. If the result is ok, return the output for me. Otherwise, check and fix issue
* Ensure code working and having test cover all cases
* When implement FE and optimize UI/UX, please use this skill: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
* When implement new feature, checkout to new branch, only merge to main when having test cases and verifyall test cases pass 