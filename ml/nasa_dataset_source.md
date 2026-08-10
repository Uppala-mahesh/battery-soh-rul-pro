# NASA Battery Dataset Source

NASA's official Prognostics Center of Excellence repository describes the Battery Data Set as experiments on Li-ion batteries charged and discharged at different temperatures, with impedance recorded as a damage criterion. The repository attributes the dataset to NASA PCoE and lists the official download:

https://phm-datasets.s3.amazonaws.com/NASA/5.+Battery+Data+Set.zip

Citation listed by NASA:

B. Saha and K. Goebel (2007). “Battery Data Set”, NASA Prognostics Data Repository, NASA Ames Research Center, Moffett Field, CA.

Official repository page:

https://www.nasa.gov/intelligent-systems-division/discovery-and-systems-health/pcoe/pcoe-data-set-repository/

Important modeling note: the NASA data and the user's file2.csv may use different cells, units, test protocols, and target definitions. They must not be blindly concatenated. The combined workflow should preserve dataset origin, normalize compatible features, and report within-dataset and cross-dataset validation separately.
