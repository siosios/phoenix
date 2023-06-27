Feature: Search
  As a user
  I want to do full text search
  So that I can find the files with the content I am looking for

  Scenario: search for content of file
    Given "Admin" creates following users using API
      | id    |
      | Alice |
      | Brian |
    And "Admin" assigns following roles to the users using API
      | id    | role        |
      | Brian | Space Admin |
    And "Alice" logs in
    And "Alice" uploads the following local file into personal space using API
      | localFile                   | to              |
      | filesForUpload/textfile.txt | fileToShare.txt |
    And "Alice" opens the "files" app
    And "Alice" adds the following tags for the following resources using the sidebar panel
      | resource        | tags      |
      | fileToShare.txt | alice tag |
    And "Alice" shares the following resource using API
      | resource        | recipient | type | role     |
      | fileToShare.txt | Brian     | user | Can edit |
    And "Alice" logs out
    And "Brian" logs in
    And "Brian" accepts the following share using API
      | name            |
      | fileToShare.txt |
    And "Brian" creates the following folder in personal space using API
      | name       |
      | testFolder |
    And "Brian" uploads the following local file into personal space using API
      | localFile                   | to                           |
      | filesForUpload/textfile.txt | textfile.txt                 |
      | filesForUpload/textfile.txt | fileWithTag.txt              |
      | filesForUpload/textfile.txt | withTag.txt                  |
      | filesForUpload/textfile.txt | testFolder/innerTextfile.txt |
    And "Brian" creates the following project spaces using API
      | name           | id               |
      | FullTextSearch | fulltextsearch.1 |
    And "Brian" creates the following folder in space "FullTextSearch" using API
      | name        |
      | spaceFolder |
    And "Brian" creates the following file in space "FullTextSearch" using API
      | name                          | content                   |
      | spaceFolder/spaceTextfile.txt | This is test file. Cheers |
    And "Brian" opens the "files" app
    And "Brian" adds the following tags for the following resources using the sidebar panel
      | resource        | tags  |
      | fileWithTag.txt | tag 1 |
      | withTag.txt     | tag 1 |

    When "Brian" searches "" using the global search bar
    Then "Brian" should see the message "Search for files" on the webUI

    When "Brian" selects tag "alice tag" from the search result filter chip
    Then following resources should be displayed in the files list for user "Brian"
      | resource        |
      | fileToShare.txt |

    When "Brian" clears tag filter 
    And "Brian" selects tag "tag 1" from the search result filter chip
    Then following resources should be displayed in the files list for user "Brian"
      | resource        |
      | fileWithTag.txt |
      | withTag.txt     |

    When "Brian" searches "file" using the global search bar
    Then following resources should be displayed in the files list for user "Brian"
      | resource        |
      | fileWithTag.txt |

    When "Brian" clears tag filter
    Then following resources should be displayed in the files list for user "Brian"
      | resource                      |
      | textfile.txt                  |
      | fileWithTag.txt               |
      | testFolder/innerTextfile.txt  |
      | fileToShare.txt               |
      | spaceFolder/spaceTextfile.txt |

    When "Brian" enables the option to search in file content
    And "Brian" searches "Cheers" using the global search bar
    Then following resources should be displayed in the files list for user "Brian"
      | resource                      |
      | textfile.txt                  |
      | testFolder/innerTextfile.txt  |
      | fileToShare.txt               |
      | fileWithTag.txt               |
      | withTag.txt                   |
      | spaceFolder/spaceTextfile.txt |
    And "Brian" logs out
